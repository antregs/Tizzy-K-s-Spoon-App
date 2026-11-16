import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { C } from "../lib/theme";
import { Screen, Band, Field, Btn, ErrorText, LinkBtn, H } from "../components/ui";
import ProfileFields from "../components/ProfileForm";

/**
 * Shown when someone is signed in but has no Spoon Rewards profile yet
 * (right after email sign-up, or the first Google sign-in).
 */
export default function CompleteProfileScreen() {
  const { authUser, pendingProfile, setPendingProfile, logout, toast, celebrate } = useApp();
  const [name, setName] = useState(pendingProfile?.name || authUser?.displayName || "");
  const [details, setDetails] = useState({ spoon: "", school: "", phone: "", birthday: "", ref: "", ...(pendingProfile || {}) });
  const [error, setError] = useState(""); const [field, setField] = useState("");
  const [busy, setBusy] = useState(!!pendingProfile);
  const auto = useRef(false);

  async function create(data) {
    setError(""); setField(""); setBusy(true);
    try {
      const r = await api.createProfile({ name: data.name, phone: data.phone, school: data.school, birthday: data.birthday, referralCode: data.ref, spoonCode: data.spoon });
      setPendingProfile(null);
      celebrate();
      toast(r.rewardsMember ? `Welcome! Your punch card is ready.` : `Welcome! Go cast your first vote.`, "ok", 4000);
    } catch (e) {
      setPendingProfile(null);
      setError(e.message + (data.spoon ? " (Or clear the spoon code to sign up just for voting.)" : ""));
      if (/spoon/i.test(e.message)) setField("spoon"); else if (/school/i.test(e.message)) setField("school");
      setBusy(false);
    }
  }

  useEffect(() => { if (pendingProfile && !auto.current) { auto.current = true; create(pendingProfile); } }, []); // eslint-disable-line

  if (busy && pendingProfile) {
    return <View style={{ flex: 1, backgroundColor: C.page, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={C.tq} size="large" /><H style={{ marginTop: 14 }}>Creating your account…</H></View>;
  }
  return (
    <Screen>
      <Band title="Almost done!" sub="A few details to finish your free account." tone="tq" right={false} />
      <Field label="Name" value={name} onChangeText={setName} autoComplete="name" error={field === "name"} />
      <ProfileFields value={details} onChange={setDetails} errorField={field} />
      <ErrorText>{error}</ErrorText>
      <Btn title="Create my free account" icon="sparkles-outline" loading={busy} onPress={() => {
        if (!name.trim()) { setField("name"); return setError("Please add your name."); }
        if (!details.school.trim()) { setField("school"); return setError("Please choose your school (or “Not a student”)."); }
        create({ ...details, name: name.trim() });
      }} />
      <LinkBtn title="Cancel and log out" onPress={logout} />
    </Screen>
  );
}
