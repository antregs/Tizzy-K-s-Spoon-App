import React, { useState } from "react";
import { View } from "react-native";
import { useApp } from "../context/AppContext";
import { authErrorMessage } from "../lib/api";
import { Screen, Band, Field, Btn, ErrorText, LinkBtn, Muted } from "../components/ui";
import ProfileFields from "../components/ProfileForm";
import GoogleButton from "../components/GoogleButton";

export default function SignUpScreen({ navigation }) {
  const { signUpEmail, setPendingProfile } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [details, setDetails] = useState({ spoon: "", school: "", phone: "", birthday: "", ref: "" });
  const [error, setError] = useState(""); const [field, setField] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(""); setField("");
    if (!name.trim()) { setField("name"); return setError("Please add your name."); }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setField("email"); return setError("Please enter a valid email address."); }
    if (password.length < 6) { setField("password"); return setError("Use at least 6 characters for your password."); }
    if (!details.school.trim()) { setField("school"); return setError("Please choose your school (or “Not a student”)."); }
    setBusy(true);
    // Profile is created right after the account exists (CompleteProfile screen picks this up).
    setPendingProfile({ name: name.trim(), email: email.trim(), ...details });
    try { await signUpEmail(email, password, name.trim()); }
    catch (e) { setPendingProfile(null); setError(authErrorMessage(e)); setBusy(false); }
  }

  return (
    <Screen>
      <Band title="Create your account" sub="Free to join — vote on flavors and pop-ups right away." tone="tq" right={false} back />
      <GoogleButton title="Sign up with Google" onError={setError} />
      <Muted style={{ textAlign: "center", marginVertical: 12 }}>or sign up with email</Muted>
      <Field label="Name" autoComplete="name" placeholder="Alex Rivera" value={name} onChangeText={setName} error={field === "name"} />
      <Field label="Email" autoComplete="email" keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" value={email} onChangeText={setEmail} error={field === "email"} />
      <Field label="Password" hint="(6+ characters)" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} error={field === "password"} />
      <ProfileFields value={details} onChange={setDetails} errorField={field} />
      <ErrorText>{error}</ErrorText>
      <Btn title="Create my free account" icon="sparkles-outline" onPress={submit} loading={busy} />
      <LinkBtn title="Already a member? Log In" onPress={() => navigation.replace("SignIn")} />
    </Screen>
  );
}
