import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile as updateAuthProfile } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query, limit, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getPushToken } from "../lib/notifications";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined);   // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(undefined);     // undefined = loading, null = none yet
  const [rewards, setRewards] = useState([]);
  const [activity, setActivity] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [poll, setPoll] = useState(null);
  const [myBallot, setMyBallot] = useState(null);
  const [guest, setGuest] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null); // sign-up form data waiting for auth
  const [toastState, setToastState] = useState(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const toastTimer = useRef(null);

  const toast = useCallback((msg, kind = "ok", ms = 3200) => {
    clearTimeout(toastTimer.current);
    setToastState({ msg, kind, id: Date.now() });
    toastTimer.current = setTimeout(() => setToastState(null), ms);
  }, []);
  const celebrate = useCallback(() => setConfettiKey(k => k + 1), []);

  // Auth
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setAuthUser(u || null);
    if (u) {
      setGuest(false);
      try { const t = await u.getIdTokenResult(true); setIsAdmin(t.claims.admin === true); } catch (e) { setIsAdmin(false); }
    } else { setIsAdmin(false); setProfile(null); setRewards([]); setActivity([]); setMyBallot(null); }
  }), []);

  // Profile, rewards, activity
  useEffect(() => {
    if (!authUser) return;
    setProfile(undefined);
    const uid = authUser.uid;
    const u1 = onSnapshot(doc(db, "users", uid), s => setProfile(s.exists() ? { id: s.id, ...s.data() } : null), () => setProfile(null));
    const u2 = onSnapshot(query(collection(db, "users", uid, "rewards"), orderBy("earnedAt", "desc")), s => setRewards(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    const u3 = onSnapshot(query(collection(db, "users", uid, "activity"), orderBy("at", "desc"), limit(60)), s => setActivity(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    return () => { u1(); u2(); u3(); };
  }, [authUser]);

  // Public catalog (works signed out too)
  useEffect(() => onSnapshot(collection(db, "catalog"), s => {
    const c = {}; s.docs.forEach(d => { c[d.id] = d.data(); }); setCatalog(c);
  }, () => {}), []);

  const weekId = catalog.flavors?.weekId || isoWeek(new Date());

  // Weekly poll tallies + my ballot
  useEffect(() => onSnapshot(doc(db, "polls", weekId), s => setPoll(s.exists() ? s.data() : null), () => setPoll(null)), [weekId]);
  useEffect(() => {
    if (!authUser) return;
    return onSnapshot(doc(db, "polls", weekId, "voters", authUser.uid), s => setMyBallot(s.exists() ? s.data() : null), () => setMyBallot(null));
  }, [authUser, weekId]);

  // Push token
  useEffect(() => {
    if (!authUser || !profile || !profile.notifications) return;
    let cancelled = false;
    getPushToken().then(t => { if (!cancelled && t && t !== profile.pushToken) saveProfile({ pushToken: t }).catch(() => {}); });
    return () => { cancelled = true; };
  }, [authUser?.uid, profile?.notifications]); // eslint-disable-line

  async function saveProfile(patch) {
    if (!authUser || !profile) return;
    await updateDoc(doc(db, "users", authUser.uid), patch);
  }

  const actions = useMemo(() => ({
    signUpEmail: async (email, password, name) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name) updateAuthProfile(cred.user, { displayName: name }).catch(() => {});
      return cred.user;
    },
    signInEmail: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    logout: async () => { await signOut(auth); setGuest(false); },
    browseAsGuest: () => setGuest(true),
    leaveGuest: () => setGuest(false),
    saveProfile,
    refreshClaims: async () => { if (auth.currentUser) { const t = await auth.currentUser.getIdTokenResult(true); setIsAdmin(t.claims.admin === true); } },
    saveCatalog: (name, body) => setDoc(doc(db, "catalog", name), body, { merge: false })
  }), [authUser, profile]); // eslint-disable-line

  const value = {
    authUser, isAdmin, profile, rewards, activity, catalog, poll, myBallot, weekId, guest, pendingProfile, setPendingProfile,
    isMember: !!profile?.spoon, spoonPrice: catalog.settings?.spoonPrice || "$5",
    spoonWhere: catalog.settings?.spoonWhere || "the Tizzy Kar pop-up",
    toast, toastState, celebrate, confettiKey, ...actions
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
