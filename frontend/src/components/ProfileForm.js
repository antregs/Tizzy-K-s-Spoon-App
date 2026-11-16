import React, { useState } from "react";
import { View, Platform, Pressable, Text } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Card, Field, SchoolPicker, Btn, H, Muted, ErrorText } from "./ui";
import { C, F, normalizeSpoon } from "../lib/theme";
import { useApp } from "../context/AppContext";
import { useNavigation } from "@react-navigation/native";

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Birthday input: native date picker on phones, <input type=date> on web. */
export function BirthdayInput({ value, onChange, locked }) {
  const [show, setShow] = useState(false);
  if (Platform.OS === "web") {
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.tqDark, marginBottom: 6 }}>Birthday <Text style={{ fontFamily: F.body, color: C.tqMuted }}>{locked ? "(locked)" : "(optional · unlocks a birthday reward · can't be changed later)"}</Text></Text>
        {React.createElement("input", { type: "date", value: value || "", disabled: locked, max: ymd(new Date()), onChange: e => onChange(e.target.value),
          style: { minHeight: 50, borderRadius: 14, border: `1.5px solid ${C.line}`, padding: "0 14px", fontSize: 16, color: C.tqDark, background: "#fff", fontFamily: "inherit" } })}
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.tqDark, marginBottom: 6 }}>Birthday <Text style={{ fontFamily: F.body, color: C.tqMuted }}>{locked ? "(locked)" : "(optional · can't be changed later)"}</Text></Text>
      <Pressable disabled={locked} onPress={() => setShow(true)} style={{ minHeight: 50, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white, paddingHorizontal: 14, justifyContent: "center", opacity: locked ? 0.6 : 1 }}>
        <Text style={{ fontFamily: F.body, fontSize: 16, color: value ? C.tqDark : "#8FBDBA" }}>{value ? new Date(value + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Add your birthday"}</Text>
      </Pressable>
      {show ? <DateTimePicker value={value ? new Date(value + "T12:00:00") : new Date(2004, 0, 1)} mode="date" maximumDate={new Date()} display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={(e, d) => { setShow(Platform.OS === "ios"); if (d && e.type !== "dismissed") onChange(ymd(d)); if (Platform.OS === "ios" && e.type === "set") setShow(false); }} /> : null}
    </View>
  );
}

/**
 * Shared sign-up details: optional spoon, school, phone, birthday, referral.
 * `value` / `onChange` hold { spoon, school, phone, birthday, ref }.
 */
export default function ProfileFields({ value, onChange, errorField }) {
  const { spoonPrice, spoonWhere } = useApp();
  const nav = useNavigation();
  const set = k => v => onChange({ ...value, [k]: v });
  return (
    <>
      <Card soft style={{ marginBottom: 18 }}>
        <H size={15}>Have a spoon? Join rewards now <Text style={{ fontFamily: F.body, color: C.tqMuted, fontSize: 13 }}>(optional)</Text></H>
        <Muted style={{ marginTop: 4, marginBottom: 10 }}>Signing up to vote is free. To earn punches and rewards, buy a collapsible spoon at {spoonWhere} — the only place they're sold ({spoonPrice}, one time) — and link it here or later.</Muted>
        <Btn kind="white" small icon="camera-outline" title="Scan the spoon's QR code" onPress={() => nav.navigate("Scan", { mode: "fill", onCode: c => onChange({ ...value, spoon: c }) })} />
        <Field style={{ marginTop: 12, marginBottom: 0 }} label="…or type the spoon code" code placeholder="TZK-XXXX-XXXX" autoCapitalize="characters" autoCorrect={false}
          value={value.spoon} onChangeText={t => set("spoon")(t.toUpperCase())} onBlur={() => value.spoon && set("spoon")(normalizeSpoon(value.spoon))} error={errorField === "spoon"} />
      </Card>
      <SchoolPicker value={value.school} onChange={set("school")} error={errorField === "school"} />
      <Field label="Phone" hint="(optional)" keyboardType="phone-pad" autoComplete="tel" placeholder="(401) 555-0123" value={value.phone} onChangeText={set("phone")} />
      <BirthdayInput value={value.birthday} onChange={set("birthday")} />
      <Field label="Friend's referral code" hint="(optional)" code placeholder="SR-XXXXX" autoCapitalize="characters" autoCorrect={false} value={value.ref} onChangeText={t => set("ref")(t.toUpperCase())} />
    </>
  );
}
