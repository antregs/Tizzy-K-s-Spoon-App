// Thin wrappers around the Cloud Functions. Errors come back with the
// friendly message the server wrote.
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

function call(name) {
  const fn = httpsCallable(functions, name);
  return async (data) => {
    try { return (await fn(data || {})).data; }
    catch (e) {
      const msg = e?.message && !/^internal$/i.test(e.message) ? e.message.replace(/^.*?: /, "") : "Something went wrong. Check your connection and try again.";
      const err = new Error(msg); err.code = e?.code; throw err;
    }
  };
}

export const api = {
  createProfile: call("createProfile"),
  setBirthday: call("setBirthday"),
  applyReferral: call("applyReferral"),
  linkSpoon: call("linkSpoon"),
  logPunch: call("logPunch"),
  claimReward: call("claimReward"),
  castVote: call("castVote"),
  adminGenerateSpoons: call("adminGenerateSpoons"),
  adminLookupSpoon: call("adminLookupSpoon"),
  adminUnlinkSpoon: call("adminUnlinkSpoon"),
  adminCheckRedemption: call("adminCheckRedemption"),
  adminStartNewWeek: call("adminStartNewWeek"),
  adminStats: call("adminStats")
};

export function authErrorMessage(e) {
  const code = e?.code || "";
  if (code.includes("email-already-in-use")) return "That email already has an account — try logging in.";
  if (code.includes("invalid-email")) return "Please enter a valid email address.";
  if (code.includes("weak-password")) return "Use at least 6 characters for your password.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email or password is incorrect.";
  if (code.includes("too-many-requests")) return "Too many tries — wait a minute and try again.";
  if (code.includes("network")) return "No connection. Check your internet and try again.";
  if (code.includes("popup-closed")) return "Sign-in window closed before finishing.";
  return e?.message || "Something went wrong. Try again.";
}
