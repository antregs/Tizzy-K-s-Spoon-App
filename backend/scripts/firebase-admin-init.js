// Shared Firebase Admin setup for the scripts.
// Uses GOOGLE_APPLICATION_CREDENTIALS (a service-account JSON from
// Firebase console → Project settings → Service accounts), or the
// emulator when FIRESTORE_EMULATOR_HOST is set.
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  admin.initializeApp(projectId ? { projectId } : undefined);
}
module.exports = admin;
