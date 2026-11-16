// Gives a signed-up account admin access (Admin panel in the app).
// Usage: node set-admin.js owner@example.com          (grant)
//        node set-admin.js owner@example.com --remove (revoke)
const admin = require("./firebase-admin-init");

(async () => {
  const email = process.argv[2];
  if (!email) { console.error("Usage: node set-admin.js <email> [--remove]"); process.exit(1); }
  const user = await admin.auth().getUserByEmail(email);
  const on = !process.argv.includes("--remove");
  await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: on });
  console.log(`${on ? "Granted" : "Removed"} admin for ${email} (${user.uid}). They need to sign out and back in.`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
