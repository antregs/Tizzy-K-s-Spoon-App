/**
 * Spoon Rewards — Cloud Functions (Firebase Functions v2, Node 20)
 *
 * Every rule that matters (who owns a spoon, punches, rewards, votes) is
 * enforced here, on the server. The app can only call these functions; the
 * Firestore security rules block direct writes to those fields.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;

const REGION = "us-east1";
setGlobalOptions({ region: REGION, maxInstances: 10 });

/* ------------------------------------------------------------------ */
/* Program rules — change here                                         */
/* ------------------------------------------------------------------ */
const RULES = {
  punchesForDiscount: 5,          // 10% off
  punchesForFreeScoop: 10,        // free scoop + fresh card
  punchCooldownMs: 3 * 60 * 60 * 1000, // one spoon punch per 3 hours
  voucherMinutes: 15,             // claimed reward code is valid this long
  timezone: "America/New_York"
};

const REWARD_TYPES = {
  scoop:    { title: "Free Scoop",         desc: "Any cereal flavor in a cup or blue waffle cone — cereal crunch & crispy treat on top." },
  ten:      { title: "10% Off Next Order", desc: "10% off your whole order." },
  bday:     { title: "Birthday Reward",    desc: "A free birthday scoop with extra cereal crunch — on us!" },
  referral: { title: "Referral Bonus",     desc: "Extra cereal crunch on your next scoop." }
};

const CODE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SPOON_RE = /^TZK-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const REF_RE = /^SR-[A-HJ-NP-Z2-9]{5}$/;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function randomCode(n) {
  const bytes = crypto.randomBytes(n);
  return Array.from(bytes, b => CODE_ALPHA[b % CODE_ALPHA.length]).join("");
}
const sha256 = s => crypto.createHash("sha256").update(s).digest("hex");

function normalizeSpoon(raw) {
  let s = String(raw || "").trim().toUpperCase();
  const m = s.match(/TZK[-\s]?[A-Z0-9]{4}[-\s]?[A-Z0-9]{4}/);
  if (m) s = m[0];
  s = s.replace(/[^A-Z0-9]/g, "");
  if (s.length === 11 && s.startsWith("TZK")) s = `TZK-${s.slice(3, 7)}-${s.slice(7)}`;
  return s;
}
const maskSpoon = c => c.replace(/^(TZK-)(....)-/, "$1••••-");

function requireAuth(req) {
  if (!req.auth) throw new HttpsError("unauthenticated", "Please sign in first.");
  return req.auth.uid;
}
function requireAdmin(req) {
  requireAuth(req);
  if (req.auth.token.admin !== true) throw new HttpsError("permission-denied", "Admins only.");
}
function str(v, max) { return String(v ?? "").trim().slice(0, max); }

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}
async function currentWeek(tx) {
  const ref = db.doc("catalog/flavors");
  const snap = tx ? await tx.get(ref) : await ref.get();
  return (snap.exists && snap.data().weekId) || isoWeek(new Date());
}
function nowInTz() {
  // Month/day/year in the shop's timezone
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: RULES.timezone, year: "numeric", month: "numeric", day: "numeric" })
    .formatToParts(new Date()).reduce((o, p) => (o[p.type] = p.value, o), {});
  return { year: +parts.year, month: +parts.month, day: +parts.day };
}

function rewardDoc(type, note) {
  return { type, title: REWARD_TYPES[type].title, desc: REWARD_TYPES[type].desc, status: "available", note: note || "",
           earnedAt: FieldValue.serverTimestamp() };
}
function activityDoc(type, label) {
  return { type, label, at: FieldValue.serverTimestamp() };
}
function addReward(tx, uid, type, note) {
  const ref = db.collection(`users/${uid}/rewards`).doc();
  tx.set(ref, rewardDoc(type, note));
  tx.set(db.collection(`users/${uid}/activity`).doc(), activityDoc("earned", `Earned: ${REWARD_TYPES[type].title}`));
  return ref.id;
}
function addActivity(tx, uid, type, label) {
  tx.set(db.collection(`users/${uid}/activity`).doc(), activityDoc(type, label));
}

/** Look up a spoon code inside a transaction. */
async function readSpoon(tx, rawCode) {
  const code = normalizeSpoon(rawCode);
  if (!SPOON_RE.test(code)) throw new HttpsError("invalid-argument", "Spoon codes look like TZK-XXXX-XXXX.");
  const hash = sha256(code);
  const ref = db.doc(`spoons/${hash}`);
  const snap = await tx.get(ref);
  if (!snap.exists || snap.data().disabled) {
    throw new HttpsError("not-found", "That code isn't a registered Tizzy K's spoon. Check the code on the handle, or ask the Tizzy Kar crew.");
  }
  return { code, hash, ref, data: snap.data() };
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

/**
 * createProfile — called right after sign-up (email or Google).
 * Free account: voting + events. Spoon code is optional; with it the
 * member joins the rewards program immediately.
 */
exports.createProfile = onCall(async (req) => {
  const uid = requireAuth(req);
  const d = req.data || {};
  const name = str(d.name, 60);
  const school = str(d.school, 80);
  const phone = str(d.phone, 30);
  const birthday = /^\d{4}-\d{2}-\d{2}$/.test(d.birthday || "") ? d.birthday : "";
  if (!name) throw new HttpsError("invalid-argument", "Please add your name.");
  if (!school) throw new HttpsError("invalid-argument", "Please choose your school (or “Not a student”).");
  const email = str(req.auth.token.email || d.email, 120);

  const result = await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    if ((await tx.get(userRef)).exists) throw new HttpsError("already-exists", "You already have an account.");

    // Optional spoon
    let spoon = null;
    if (str(d.spoonCode, 40)) {
      spoon = await readSpoon(tx, d.spoonCode);
      if (spoon.data.ownerUid) throw new HttpsError("already-exists", "This spoon is already linked to another member's profile.");
    }
    // Optional referral
    let referrer = null;
    const refCode = str(d.referralCode, 12).toUpperCase();
    if (refCode) {
      if (!REF_RE.test(refCode)) throw new HttpsError("invalid-argument", "Referral codes look like SR-XXXXX.");
      const r = await tx.get(db.doc(`referralCodes/${refCode}`));
      if (!r.exists) throw new HttpsError("not-found", "We couldn't find that referral code.");
      referrer = r.data().uid;
    }
    // Unique referral code for this member
    let myCode = null;
    for (let i = 0; i < 6 && !myCode; i++) {
      const c = `SR-${randomCode(5)}`;
      if (!(await tx.get(db.doc(`referralCodes/${c}`))).exists) myCode = c;
    }
    if (!myCode) throw new HttpsError("internal", "Please try again.");

    const b = birthday ? new Date(birthday + "T12:00:00") : null;
    tx.set(userRef, {
      name, email, phone, school, birthday, birthMonth: b ? b.getMonth() + 1 : 0, bdayYear: 0,
      photoURL: "", notifications: true, pushToken: "",
      memberSince: FieldValue.serverTimestamp(),
      punches: 0, lifetimePunches: 0, cardsCompleted: 0, lastPunchAt: 0,
      rewardsMember: !!spoon,
      spoon: spoon ? { hash: spoon.hash, masked: maskSpoon(spoon.code), linkedAt: Date.now() } : null,
      referralCode: myCode, referredBy: referrer ? refCode : ""
    });
    tx.set(db.doc(`referralCodes/${myCode}`), { uid });
    addActivity(tx, uid, "earned", "Joined Spoon Rewards 🎉");
    if (spoon) {
      tx.update(spoon.ref, { ownerUid: uid, linkedAt: FieldValue.serverTimestamp() });
      addActivity(tx, uid, "spoon", `Spoon linked: ${maskSpoon(spoon.code)}`);
    }
    if (referrer && referrer !== uid) {
      addReward(tx, uid, "referral", "Welcome gift for joining with a friend's code");
      addReward(tx, referrer, "referral", "A friend joined with your code");
      tx.update(db.doc(`users/${referrer}`), { referralCount: FieldValue.increment(1) });
    }
    return { referralCode: myCode, rewardsMember: !!spoon };
  });
  return result;
});

/** setBirthday — birthday can be set once (it drives the birthday reward). */
exports.setBirthday = onCall(async (req) => {
  const uid = requireAuth(req);
  const birthday = req.data?.birthday;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday || "")) throw new HttpsError("invalid-argument", "Pick a valid date.");
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`users/${uid}`); const s = await tx.get(ref);
    if (!s.exists) throw new HttpsError("not-found", "Create your profile first.");
    if (s.data().birthday) throw new HttpsError("failed-precondition", "Your birthday is already set.");
    tx.update(ref, { birthday, birthMonth: new Date(birthday + "T12:00:00").getMonth() + 1 });
  });
  return { ok: true };
});

/** applyReferral — a member who skipped the code at sign-up can add it once. */
exports.applyReferral = onCall(async (req) => {
  const uid = requireAuth(req);
  const code = str(req.data?.code, 12).toUpperCase();
  if (!REF_RE.test(code)) throw new HttpsError("invalid-argument", "Referral codes look like SR-XXXXX.");
  await db.runTransaction(async (tx) => {
    const me = await tx.get(db.doc(`users/${uid}`));
    if (!me.exists) throw new HttpsError("not-found", "Create your profile first.");
    if (me.data().referredBy) throw new HttpsError("failed-precondition", "You've already used a referral code.");
    if (me.data().referralCode === code) throw new HttpsError("invalid-argument", "That's your own code — share it with a friend!");
    const r = await tx.get(db.doc(`referralCodes/${code}`));
    if (!r.exists) throw new HttpsError("not-found", "We couldn't find that code.");
    tx.update(me.ref, { referredBy: code });
    addReward(tx, uid, "referral", "Welcome gift for joining with a friend's code");
    addReward(tx, r.data().uid, "referral", "A friend joined with your code");
    tx.update(db.doc(`users/${r.data().uid}`), { referralCount: FieldValue.increment(1) });
  });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* Spoons & punches                                                    */
/* ------------------------------------------------------------------ */

/**
 * linkSpoon — joins the rewards program (first spoon) or replaces a lost one.
 * A replaced spoon is retired so it can never be used again.
 */
exports.linkSpoon = onCall(async (req) => {
  const uid = requireAuth(req);
  return db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const user = await tx.get(userRef);
    if (!user.exists) throw new HttpsError("not-found", "Create your profile first.");
    const spoon = await readSpoon(tx, req.data?.code);
    if (spoon.data.ownerUid && spoon.data.ownerUid !== uid) throw new HttpsError("already-exists", "This spoon is already linked to another member's profile.");
    if (spoon.data.ownerUid === uid) throw new HttpsError("already-exists", "That spoon is already linked to your profile.");
    const prev = user.data().spoon;
    if (prev?.hash) tx.set(db.doc(`spoons/${prev.hash}`), { disabled: true, retiredAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.update(spoon.ref, { ownerUid: uid, linkedAt: FieldValue.serverTimestamp() });
    tx.update(userRef, { spoon: { hash: spoon.hash, masked: maskSpoon(spoon.code), linkedAt: Date.now() }, rewardsMember: true });
    if (!user.data().rewardsMember) addActivity(tx, uid, "earned", "Joined the Spoon Rewards program 🥄");
    addActivity(tx, uid, "spoon", `Spoon linked: ${maskSpoon(spoon.code)}`);
    return { joined: !user.data().rewardsMember, masked: maskSpoon(spoon.code) };
  });
});

/** logPunch — scan your own spoon after a purchase. */
exports.logPunch = onCall(async (req) => {
  const uid = requireAuth(req);
  return db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const user = await tx.get(userRef);
    if (!user.exists) throw new HttpsError("not-found", "Create your profile first.");
    const u = user.data();
    if (!u.spoon?.hash) throw new HttpsError("failed-precondition", "Link a spoon from the Tizzy Kar pop-up to start earning punches.");
    const code = normalizeSpoon(req.data?.code);
    if (!SPOON_RE.test(code)) throw new HttpsError("invalid-argument", "Spoon codes look like TZK-XXXX-XXXX.");
    const hash = sha256(code);
    if (hash !== u.spoon.hash) {
      const other = await tx.get(db.doc(`spoons/${hash}`));
      if (other.exists && other.data().ownerUid) throw new HttpsError("permission-denied", "That spoon belongs to another member. Scan the spoon linked to your profile.");
      throw new HttpsError("permission-denied", "That isn't the spoon linked to your profile. Lost yours? Use Profile → My spoon to link a new one.");
    }
    const s = await tx.get(db.doc(`spoons/${hash}`));
    if (!s.exists || s.data().disabled || s.data().ownerUid !== uid) {
      throw new HttpsError("permission-denied", "This spoon has been unlinked from your profile. Link a new spoon in Profile → My spoon.");
    }
    const now = Date.now();
    const next = (u.lastPunchAt || 0) + RULES.punchCooldownMs;
    if (now < next) throw new HttpsError("resource-exhausted", `You've already earned a punch this visit. Try again after ${new Date(next).toLocaleTimeString("en-US", { timeZone: RULES.timezone, hour: "numeric", minute: "2-digit" })}.`);

    let punches = (u.punches || 0) + 1;
    let completed = false, unlockedDiscount = false;
    addActivity(tx, uid, "punch", `Purchase logged · punch ${punches} of ${RULES.punchesForFreeScoop}`);
    if (punches === RULES.punchesForDiscount) { addReward(tx, uid, "ten", "Halfway there!"); unlockedDiscount = true; }
    if (punches >= RULES.punchesForFreeScoop) { addReward(tx, uid, "scoop", "Punch card complete"); completed = true; punches = 0; }
    tx.update(userRef, {
      punches, lifetimePunches: FieldValue.increment(1), lastPunchAt: now,
      ...(completed ? { cardsCompleted: FieldValue.increment(1) } : {})
    });
    return { punches, completed, unlockedDiscount, nextPunchAt: now + RULES.punchCooldownMs };
  });
});

/** claimReward — marks a reward used and returns a code to show staff. */
exports.claimReward = onCall(async (req) => {
  const uid = requireAuth(req);
  const id = str(req.data?.rewardId, 60);
  if (!id) throw new HttpsError("invalid-argument", "Missing reward.");
  return db.runTransaction(async (tx) => {
    const user = await tx.get(db.doc(`users/${uid}`));
    if (!user.exists || !user.data().spoon) throw new HttpsError("failed-precondition", "Link a spoon to use rewards.");
    const ref = db.doc(`users/${uid}/rewards/${id}`);
    const r = await tx.get(ref);
    if (!r.exists || r.data().status !== "available") throw new HttpsError("failed-precondition", "That reward has already been used.");
    const code = randomCode(6);
    const expiresAt = Timestamp.fromMillis(Date.now() + RULES.voucherMinutes * 60000);
    tx.update(ref, { status: "redeemed", redeemedAt: FieldValue.serverTimestamp(), code, expiresAt });
    tx.set(db.doc(`redemptions/${code}`), { uid, rewardId: id, type: r.data().type, title: r.data().title, at: FieldValue.serverTimestamp(), expiresAt });
    addActivity(tx, uid, "redeemed", `Redeemed: ${r.data().title}`);
    return { code, expiresAt: expiresAt.toMillis(), title: r.data().title };
  });
});

/* ------------------------------------------------------------------ */
/* Voting — free for every signed-in member                           */
/* ------------------------------------------------------------------ */
exports.castVote = onCall(async (req) => {
  const uid = requireAuth(req);
  const kind = req.data?.kind === "popup" ? "popup" : req.data?.kind === "flavor" ? "flavor" : null;
  const optionId = str(req.data?.optionId, 60);
  if (!kind || !optionId) throw new HttpsError("invalid-argument", "Pick an option to vote for.");
  return db.runTransaction(async (tx) => {
    const user = await tx.get(db.doc(`users/${uid}`));
    if (!user.exists) throw new HttpsError("not-found", "Create your free account to vote.");
    const week = await currentWeek(tx);
    const list = await tx.get(db.doc(`catalog/${kind === "flavor" ? "flavors" : "popups"}`));
    const opt = (list.data()?.items || []).find(o => o.id === optionId);
    if (!opt) throw new HttpsError("not-found", "That option isn't on this week's ballot.");
    const voterRef = db.doc(`polls/${week}/voters/${uid}`);
    const voter = await tx.get(voterRef);
    if (voter.exists && voter.data()[kind]) throw new HttpsError("already-exists", "You've already voted in this category this week.");
    tx.set(voterRef, { [kind]: optionId, at: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(db.doc(`polls/${week}`), {
      week, [`${kind}Counts`]: { [optionId]: FieldValue.increment(1) },
      ...(voter.exists ? {} : { voters: FieldValue.increment(1) })
    }, { merge: true });
    addActivity(tx, uid, "vote", `Voted: ${opt.name}`);
    return { week, name: opt.name };
  });
});

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

/** Generate and register spoon codes. Codes are returned once; only hashes are stored. */
exports.adminGenerateSpoons = onCall(async (req) => {
  requireAdmin(req);
  const count = Math.max(1, Math.min(500, parseInt(req.data?.count, 10) || 0));
  const batchLabel = str(req.data?.batch, 60);
  const codes = new Set();
  while (codes.size < count) codes.add(`TZK-${randomCode(4)}-${randomCode(4)}`);
  const list = [...codes];
  for (let i = 0; i < list.length; i += 400) {
    const b = db.batch();
    list.slice(i, i + 400).forEach(c => b.create(db.doc(`spoons/${sha256(c)}`), {
      batch: batchLabel, createdAt: FieldValue.serverTimestamp(), ownerUid: null, disabled: false
    }));
    await b.commit();
  }
  return { codes: list, payloadPrefix: "SPOONREWARDS:" };
});

exports.adminLookupSpoon = onCall(async (req) => {
  requireAdmin(req);
  const code = normalizeSpoon(req.data?.code);
  if (!SPOON_RE.test(code)) throw new HttpsError("invalid-argument", "Codes look like TZK-XXXX-XXXX.");
  const s = await db.doc(`spoons/${sha256(code)}`).get();
  if (!s.exists) return { registered: false };
  const d = s.data(); let owner = null;
  if (d.ownerUid) {
    const u = await db.doc(`users/${d.ownerUid}`).get();
    if (u.exists) owner = { uid: d.ownerUid, name: u.data().name, school: u.data().school, email: u.data().email, punches: u.data().punches };
  }
  return { registered: true, disabled: !!d.disabled, batch: d.batch || "", owner };
});

exports.adminUnlinkSpoon = onCall(async (req) => {
  requireAdmin(req);
  const code = normalizeSpoon(req.data?.code);
  const hash = sha256(code);
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`spoons/${hash}`); const s = await tx.get(ref);
    if (!s.exists) throw new HttpsError("not-found", "Not a registered spoon.");
    const owner = s.data().ownerUid;
    let userSnap = null;
    if (owner) userSnap = await tx.get(db.doc(`users/${owner}`));
    tx.update(ref, { ownerUid: null, disabled: !!req.data?.retire });
    if (userSnap?.exists && userSnap.data().spoon?.hash === hash) {
      tx.update(userSnap.ref, { spoon: null });
      addActivity(tx, owner, "spoon", "Spoon unlinked by Tizzy K's staff");
    }
  });
  return { ok: true };
});

/** Check a staff redemption code at the register. */
exports.adminCheckRedemption = onCall(async (req) => {
  requireAdmin(req);
  const code = str(req.data?.code, 10).toUpperCase();
  const s = await db.doc(`redemptions/${code}`).get();
  if (!s.exists) return { found: false };
  const d = s.data();
  return { found: true, title: d.title, expired: d.expiresAt.toMillis() < Date.now(), at: d.at?.toMillis?.() || 0 };
});

exports.adminStartNewWeek = onCall(async (req) => {
  requireAdmin(req);
  const cur = await currentWeek();
  let w = isoWeek(new Date());
  if (cur === w || cur.startsWith(w + ".")) { const m = cur.match(/\.(\d+)$/); w = `${w}.${(m ? +m[1] : 1) + 1}`; }
  await db.doc("catalog/flavors").set({ weekId: w }, { merge: true });
  return { weekId: w };
});

exports.adminStats = onCall(async (req) => {
  requireAdmin(req);
  const users = await db.collection("users").select("school", "rewardsMember").get();
  const bySchool = {}; let members = 0;
  users.forEach(u => { const k = u.get("school") || "Not given"; bySchool[k] = (bySchool[k] || 0) + 1; if (u.get("rewardsMember")) members++; });
  const week = await currentWeek();
  const poll = await db.doc(`polls/${week}`).get();
  return { signups: users.size, rewardsMembers: members, bySchool, week, voters: poll.data()?.voters || 0 };
});

/* ------------------------------------------------------------------ */
/* Push notifications (Expo push service)                              */
/* ------------------------------------------------------------------ */
async function sendPush(tokens, title, body, data) {
  const msgs = [...new Set(tokens)].filter(t => /^ExponentPushToken\[/.test(t)).map(to => ({ to, title, body, data: data || {}, sound: "default" }));
  for (let i = 0; i < msgs.length; i += 100) {
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(msgs.slice(i, i + 100))
      });
      if (!res.ok) logger.warn("Expo push failed", res.status, await res.text());
    } catch (e) { logger.error("Expo push error", e); }
  }
  return msgs.length;
}

/** Daily: birthday rewards for rewards members, during their birthday month. */
exports.birthdayRewards = onSchedule({ schedule: "every day 09:05", timeZone: RULES.timezone }, async () => {
  const { year, month } = nowInTz();
  const snap = await db.collection("users").where("birthMonth", "==", month).where("rewardsMember", "==", true).get();
  const tokens = [];
  for (const u of snap.docs) {
    if (u.get("bdayYear") === year) continue;
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(u.ref);
      if (fresh.get("bdayYear") === year) return;
      tx.update(u.ref, { bdayYear: year });
      addReward(tx, u.id, "bday", "Happy birthday from Tizzy K's!");
    });
    if (u.get("notifications") && u.get("pushToken")) tokens.push(u.get("pushToken"));
  }
  const sent = await sendPush(tokens, "Happy birthday from Tizzy K's! 🎂", "A free birthday scoop is waiting in your Spoon Rewards.", { screen: "Rewards" });
  logger.info(`Birthday rewards granted; pushes sent: ${sent}`);
});

/** Weekly (Wednesday afternoon): remind members who haven't voted yet. */
exports.pollReminder = onSchedule({ schedule: "every wednesday 15:35", timeZone: RULES.timezone }, async () => {
  const week = await currentWeek();
  const voted = new Set((await db.collection(`polls/${week}/voters`).get()).docs.filter(d => d.get("flavor")).map(d => d.id));
  const users = await db.collection("users").where("notifications", "==", true).get();
  const tokens = users.docs.filter(u => !voted.has(u.id) && u.get("pushToken")).map(u => u.get("pushToken"));
  const sent = await sendPush(tokens, "This week's flavor poll is open 🗳️", "Vote for the next Tizzy K's Flavor of the Week.", { screen: "Vote" });
  logger.info(`Poll reminders sent: ${sent}`);
});

/** When an admin starts a flash sale, notify everyone who has notifications on. */
exports.flashSaleAlert = onDocumentUpdated("catalog/settings", async (event) => {
  const before = event.data.before.data()?.flashSale || {};
  const after = event.data.after.data()?.flashSale || {};
  if (!after.active || !after.text || (before.active && before.text === after.text)) return;
  const users = await db.collection("users").where("notifications", "==", true).get();
  const tokens = users.docs.map(u => u.get("pushToken")).filter(Boolean);
  const sent = await sendPush(tokens, "Tizzy K's flash sale! ⚡", after.text, { screen: "Home" });
  logger.info(`Flash sale pushes sent: ${sent}`);
});
