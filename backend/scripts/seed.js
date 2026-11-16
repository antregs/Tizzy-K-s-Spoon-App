// Loads the starter menu (flavors, pop-ups, events, banners, shops, settings).
// Usage: node seed.js            (skips docs that already exist)
//        node seed.js --force    (overwrites them)
const path = require("path");
const admin = require("./firebase-admin-init");
const data = require(path.join(__dirname, "../database/seed-data.json"));

(async () => {
  const db = admin.firestore();
  const force = process.argv.includes("--force");
  for (const [docPath, body] of Object.entries(data)) {
    const ref = db.doc(docPath);
    if (!force && (await ref.get()).exists) { console.log(`skip   ${docPath} (exists)`); continue; }
    await ref.set(body);
    console.log(`wrote  ${docPath}`);
  }
  console.log("Done.");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
