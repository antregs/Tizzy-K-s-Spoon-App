import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from "firebase/auth";
import { auth } from "../lib/firebase";
import { authErrorMessage } from "../lib/api";
import { Btn } from "./ui";

WebBrowser.maybeCompleteAuthSession();

const ids = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
};

/** "Continue with Google": popup on web, native Google sheet on iOS/Android. */
export default function GoogleButton({ onError, title = "Continue with Google" }) {
  if (Platform.OS === "web") return <WebGoogle onError={onError} title={title} />;
  if (!ids.iosClientId && !ids.androidClientId) return null; // not configured yet
  return <NativeGoogle onError={onError} title={title} />;
}

function WebGoogle({ onError, title }) {
  const [busy, setBusy] = useState(false);
  return <Btn kind="white" icon="logo-google" title={title} loading={busy} onPress={async () => {
    setBusy(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { onError?.(authErrorMessage(e)); }
    finally { setBusy(false); }
  }} />;
}

function NativeGoogle({ onError, title }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ clientId: ids.webClientId, iosClientId: ids.iosClientId, androidClientId: ids.androidClientId });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (response?.type !== "success") { if (response) setBusy(false); return; }
    const idToken = response.params?.id_token;
    signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
      .catch(e => onError?.(authErrorMessage(e)))
      .finally(() => setBusy(false));
  }, [response]); // eslint-disable-line
  return <Btn kind="white" icon="logo-google" title={title} loading={busy} disabled={!request} onPress={() => { setBusy(true); promptAsync(); }} />;
}
