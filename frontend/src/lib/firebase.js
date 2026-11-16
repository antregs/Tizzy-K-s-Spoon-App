import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence, browserLocalPersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const isConfigured = !!config.apiKey && !!config.projectId;

const app = getApps().length ? getApp() : initializeApp(config);

// Web keeps the session in the browser; iOS/Android keep it in AsyncStorage.
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
  auth.setPersistence(browserLocalPersistence).catch(() => {});
} else {
  try { auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
  catch (e) { auth = getAuth(app); }
}

const db = getFirestore(app);
const functions = getFunctions(app, process.env.EXPO_PUBLIC_FUNCTIONS_REGION || "us-east1");

if (process.env.EXPO_PUBLIC_USE_EMULATORS === "true") {
  const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectFunctionsEmulator(functions, host, 5001);
  } catch (e) {}
}

export { app, auth, db, functions };
