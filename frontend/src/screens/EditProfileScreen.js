import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { Screen, Band, Field, SchoolPicker, Btn, ErrorText, LinkBtn } from "../components/ui";
import { BirthdayInput } from "../components/ProfileForm";

export default function EditProfileScreen({ navigation }) {
  const { profile, saveProfile, toast } = useApp();
  const [f, setF] = useState({ name: profile.name, email: profile.email, phone: profile.phone, school: profile.school, birthday: profile.birthday || "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const set = k => v => setF({ ...f, [k]: v });

  async function save() {
    setError("");
    if (!f.name.trim()) return setError("Please add your name.");
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setError("Please enter a valid email.");
    if (!f.school.trim()) return setError("Please choose your school.");
    setBusy(true);
    try {
      await saveProfile({ name: f.name.trim().slice(0, 60), email: (f.email || "").trim().slice(0, 120), phone: (f.phone || "").trim().slice(0, 30), school: f.school.trim().slice(0, 80) });
      if (!profile.birthday && f.birthday) await api.setBirthday({ birthday: f.birthday });
      toast("Profile saved.", "ok"); navigation.goBack();
    } catch (e) { setError(e.message || "Couldn't save. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Band title="Edit profile" tone="tq" right={false} back />
      <Field label="Name" value={f.name} onChangeText={set("name")} autoComplete="name" />
      <Field label="Contact email" value={f.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
      <SchoolPicker value={f.school} onChange={set("school")} />
      <Field label="Phone" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
      <BirthdayInput value={f.birthday} onChange={set("birthday")} locked={!!profile.birthday} />
      {profile.photoURL ? <LinkBtn title="Remove profile picture" onPress={() => saveProfile({ photoURL: "" }).then(() => toast("Picture removed.", "ok"))} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} /> : null}
      <ErrorText>{error}</ErrorText>
      <Btn title="Save changes" onPress={save} loading={busy} />
    </Screen>
  );
}
