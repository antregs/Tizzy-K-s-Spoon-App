import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { authErrorMessage } from "../lib/api";
import { Screen, Band, Field, Btn, ErrorText, LinkBtn, Muted, Card, T } from "../components/ui";
import GoogleButton from "../components/GoogleButton";

export default function SignInScreen({ navigation }) {
  const { signInEmail, resetPassword, toast } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  async function submit() {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    setBusy(true);
    try {
      if (resetMode) { await resetPassword(email); toast("Password reset email sent — check your inbox.", "ok", 4500); setResetMode(false); }
      else await signInEmail(email, password);
    } catch (e) { setError(authErrorMessage(e)); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Band title={resetMode ? "Reset password" : "Welcome back!"} sub={resetMode ? "We'll email you a reset link." : "Log in to your Spoon Rewards account."} tone="pink" right={false} back />
      {!resetMode ? <>
        <GoogleButton title="Log in with Google" onError={setError} />
        <Muted style={{ textAlign: "center", marginVertical: 12 }}>or use your email</Muted>
      </> : null}
      <Field label="Email" autoComplete="email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      {!resetMode ? <Field label="Password" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} onSubmitEditing={submit} /> : null}
      <ErrorText>{error}</ErrorText>
      <Btn title={resetMode ? "Send reset link" : "Log In"} icon={resetMode ? "mail-outline" : "log-in-outline"} onPress={submit} loading={busy} />
      <LinkBtn title={resetMode ? "Back to log in" : "Forgot your password?"} onPress={() => { setError(""); setResetMode(!resetMode); }} />
      <LinkBtn title="New here? Sign up free" onPress={() => navigation.replace("SignUp")} />
    </Screen>
  );
}
