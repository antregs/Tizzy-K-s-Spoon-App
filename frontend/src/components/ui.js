import React, { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Image, Modal, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { C, F, SPRINKLE_COLORS, SCHOOLS, NOT_STUDENT } from "../lib/theme";
import { useApp } from "../context/AppContext";

export const LOGO = require("../../assets/logo.png");
const MAX_W = 480; // phone-width column on wide web screens

/* ---------- Sprinkles ---------- */
function seeded(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
export function Sprinkles({ count = 18, seed = 7, opacity = 0.55, size = 1 }) {
  const items = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      left: `${r() * 96}%`, top: `${r() * 94}%`, rot: Math.round(r() * 180 - 90),
      color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length], h: (10 + r() * 8) * size
    }));
  }, [count, seed, size]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      {items.map((s, i) => (
        <View key={i} style={{ position: "absolute", left: s.left, top: s.top, width: 5 * size, height: s.h, borderRadius: 3 * size, backgroundColor: s.color, transform: [{ rotate: `${s.rot}deg` }] }} />
      ))}
    </View>
  );
}

/* ---------- Layout ---------- */
export function Screen({ children, scroll = true, padded = true, style }) {
  const inner = <View style={[{ width: "100%", maxWidth: MAX_W, alignSelf: "center", paddingHorizontal: padded ? 20 : 0, paddingBottom: 32 }, style]}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{inner}</ScrollView> : inner}
    </View>
  );
}

export function Logo({ size = 40 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.white, overflow: "hidden", borderBottomWidth: 0, ...shadow(0, 3, "rgba(0,0,0,.15)") }}>
      <Image source={LOGO} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="Tizzy K's Cereal Ice Cream" />
    </View>
  );
}

/** Solid color header block with logo, title, bell and avatar. */
export function Band({ title, sub, tone = "pink", right = true, back }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { profile, authUser } = useApp();
  const bg = tone === "tq" ? C.tq : C.pink;
  const edge = tone === "tq" ? C.tqDark : C.pinkDark;
  const initials = (profile?.name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <View style={{ marginHorizontal: -20, marginBottom: 18, backgroundColor: bg, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 24, overflow: "hidden", borderBottomWidth: 6, borderBottomColor: edge }}>
      <Sprinkles count={16} seed={title.length * 13} opacity={0.35} />
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        {back ? (
          <Pressable onPress={() => nav.goBack()} accessibilityLabel="Back" style={[s.roundBtn, { marginRight: 10 }]}><Ionicons name="chevron-back" size={22} color={C.white} /></Pressable>
        ) : null}
        <Logo size={34} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ fontFamily: F.fun, color: C.white, fontSize: 19, lineHeight: 24 }}>Tizzy K's</Text>
          <Text style={{ fontFamily: F.heading, color: C.white, fontSize: 9.5, letterSpacing: 1.6, opacity: 0.9 }}>CEREAL ICE CREAM</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.heading, fontSize: 26, color: C.white }}>{title}</Text>
          {sub ? <Text style={{ fontFamily: F.body, fontSize: 14, color: "rgba(255,255,255,.93)", marginTop: 2 }}>{sub}</Text> : null}
        </View>
        {right ? (
          <>
            <Pressable onPress={() => nav.navigate("Notifications")} accessibilityLabel="Notifications" style={[s.roundBtn, { marginRight: 8 }]}><Ionicons name="notifications-outline" size={21} color={C.white} /></Pressable>
            <Pressable onPress={() => nav.navigate("Tabs", { screen: "Profile" })} accessibilityLabel="Profile"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tone === "tq" ? C.pink : C.tq, borderWidth: 3, borderColor: C.white, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {profile?.photoURL ? <Image source={{ uri: profile.photoURL }} style={{ width: 44, height: 44 }} /> :
                authUser && initials ? <Text style={{ fontFamily: F.heading, color: C.white }}>{initials}</Text> : <Ionicons name="person" size={18} color={C.white} />}
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

/* ---------- Basics ---------- */
export function T({ style, children, ...p }) { return <Text style={[{ fontFamily: F.body, color: C.tqDark, fontSize: 15, lineHeight: 21 }, style]} {...p}>{children}</Text>; }
export function H({ style, children, size = 18 }) { return <Text style={[{ fontFamily: F.heading, color: C.tqDark, fontSize: size }, style]}>{children}</Text>; }
export function Muted({ style, children }) { return <T style={[{ color: C.tqMuted, fontSize: 13, lineHeight: 18 }, style]}>{children}</T>; }

export function SectionTitle({ children, right }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 22, marginBottom: 10 }}>
      <View style={{ alignSelf: "flex-start" }}>
        <View style={{ position: "absolute", left: 0, right: -4, bottom: 2, height: 10, backgroundColor: C.aqua, opacity: 0.6, borderRadius: 2 }} />
        <H size={17}>{children}</H>
      </View>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

export function Card({ style, children, soft, dashed }) {
  return <View style={[{ backgroundColor: soft ? "#FFD9E6" : C.card, borderRadius: 18, borderWidth: dashed ? 3 : 1, borderStyle: dashed ? "dashed" : "solid", borderColor: dashed ? C.tq : C.line, padding: 16 }, style]}>{children}</View>;
}

const BTN = {
  tq: { bg: C.tq, edge: C.tqDark, fg: C.white },
  pink: { bg: C.pink, edge: C.pinkDark, fg: C.white },
  white: { bg: C.card, edge: C.line, fg: C.tqDark },
  ghost: { bg: C.soft, edge: C.line, fg: C.tqDark },
  outline: { bg: "transparent", edge: "transparent", fg: C.white, border: C.white }
};
export function Btn({ title, onPress, kind = "tq", icon, small, disabled, loading, style }) {
  const k = BTN[kind];
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button"
      style={({ pressed }) => [{
        minHeight: small ? 40 : 54, borderRadius: small ? 12 : 16, paddingHorizontal: small ? 14 : 18,
        backgroundColor: k.bg, borderBottomWidth: pressed ? 2 : 5, borderBottomColor: k.edge,
        borderWidth: k.border ? 2 : 0, borderColor: k.border, marginTop: pressed ? 3 : 0,
        flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.45 : 1
      }, style]}>
      {loading ? <ActivityIndicator color={k.fg} /> : <>
        {icon ? <Ionicons name={icon} size={small ? 17 : 20} color={k.fg} style={{ marginRight: 8 }} /> : null}
        <Text style={{ fontFamily: F.semi, fontSize: small ? 14 : 16, color: k.fg }}>{title}</Text>
      </>}
    </Pressable>
  );
}
export function LinkBtn({ title, onPress, color = C.tqDark, style }) {
  return <Pressable onPress={onPress} style={[{ padding: 10, alignSelf: "center" }, style]}><Text style={{ fontFamily: F.bodySemi, color, textDecorationLine: "underline" }}>{title}</Text></Pressable>;
}

export function Pill({ text, kind = "tq", style }) {
  const bg = kind === "pink" ? C.pink : kind === "soft" ? C.soft : C.tq;
  return <View style={[{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: "flex-start" }, style]}><Text style={{ fontFamily: F.bodyBold, fontSize: 12, color: kind === "soft" ? C.tqDark : C.white }}>{text}</Text></View>;
}

export function Notice({ icon = "flash-outline", children }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: C.warnBg, borderColor: "#F6DE9A", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 }}>
      <Ionicons name={icon} size={18} color={C.warnText} style={{ marginRight: 8, marginTop: 1 }} />
      <Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, color: C.warnText, lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

export function Empty({ emoji, text }) {
  return <View style={{ alignItems: "center", padding: 20 }}><Text style={{ fontSize: 34 }}>{emoji}</Text><Muted style={{ textAlign: "center", marginTop: 6 }}>{text}</Muted></View>;
}

export function Field({ label, hint, error, code, style, ...p }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.tqDark, marginBottom: 6 }}>{label}{hint ? <Text style={{ fontFamily: F.body, color: C.tqMuted }}> {hint}</Text> : null}</Text> : null}
      <TextInput placeholderTextColor="#8FBDBA" {...p}
        style={{ minHeight: 50, borderRadius: 14, borderWidth: 1.5, borderColor: error ? C.danger : C.line, backgroundColor: C.white, paddingHorizontal: 14, fontSize: 16,
          fontFamily: code ? F.semi : F.body, color: C.tqDark, letterSpacing: code ? 2 : 0, textAlign: code ? "center" : "left", ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}) }} />
    </View>
  );
}
export function ErrorText({ children }) { return children ? <Text style={{ color: C.danger, fontFamily: F.body, fontSize: 13, marginBottom: 10 }}>{children}</Text> : null; }

export function Segmented({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: C.soft, borderRadius: 14, padding: 4 }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={{ flex: 1, minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: on ? C.pink : "transparent", borderBottomWidth: on ? 3 : 0, borderBottomColor: C.pinkDark }}>
            <Text style={{ fontFamily: F.semi, fontSize: 13.5, color: on ? C.white : C.tqMuted, textAlign: "center" }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, max }) {
  return (
    <View style={{ height: 14, borderRadius: 8, backgroundColor: "rgba(7,116,112,.12)", overflow: "hidden" }}>
      <View style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", backgroundColor: C.pink, borderRadius: 8 }} />
      <View style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, backgroundColor: C.white }} />
    </View>
  );
}

export function Bars({ rows, color = C.pink, mine }) {
  const total = rows.reduce((a, r) => a + r.count, 0);
  const max = Math.max(1, ...rows.map(r => r.count));
  return rows.map(r => (
    <View key={r.id} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
        <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.tqDark, flex: 1 }}>{r.label}{mine === r.id ? " ✓" : ""}</Text>
        <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.tqDark }}>{total ? Math.round((r.count / total) * 100) : 0}% · {r.count}</Text>
      </View>
      <View style={{ height: 12, borderRadius: 7, backgroundColor: "rgba(7,116,112,.12)", overflow: "hidden" }}>
        <View style={{ width: `${(r.count / max) * 100}%`, height: "100%", backgroundColor: color, borderRadius: 7 }} />
      </View>
    </View>
  ));
}

/** School dropdown (modal list) with "Other" free text. */
export function SchoolPicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const known = !value || SCHOOLS.includes(value) || value === NOT_STUDENT;
  const [other, setOther] = useState(!known);
  const label = other ? "Other school…" : value || "Choose your school…";
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: C.tqDark, marginBottom: 6 }}>School</Text>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Choose your school"
        style={{ minHeight: 50, borderRadius: 14, borderWidth: 1.5, borderColor: error ? C.danger : C.line, backgroundColor: C.white, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontFamily: F.body, fontSize: 16, color: value || other ? C.tqDark : "#8FBDBA" }}>{label}</Text>
        <Ionicons name="chevron-down" size={18} color={C.tqDark} />
      </Pressable>
      {other ? <Field style={{ marginTop: 10, marginBottom: 0 }} placeholder="Your school's name" value={known ? "" : value} onChangeText={onChange} autoFocus /> : null}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,.35)", justifyContent: "flex-end" }} onPress={() => setOpen(false)}>
          <Pressable style={{ backgroundColor: "#FFEFF5", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 16, maxHeight: "75%", width: "100%", maxWidth: MAX_W, alignSelf: "center" }}>
            <H style={{ marginBottom: 8 }}>Your school</H>
            <ScrollView>
              {[...SCHOOLS, "__other", NOT_STUDENT].map(sc => (
                <Pressable key={sc} onPress={() => { setOpen(false); if (sc === "__other") { setOther(true); onChange(""); } else { setOther(false); onChange(sc); } }}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ flex: 1, fontFamily: F.bodySemi, color: C.tqDark, fontSize: 15 }}>{sc === "__other" ? "Other school…" : sc}</Text>
                  {(sc === value && !other) || (sc === "__other" && other) ? <Ionicons name="checkmark" size={20} color={C.pink} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** The "Join the rewards program" card shown to free members. */
export function JoinCard({ onScan, compact }) {
  const { spoonPrice, spoonWhere, authUser } = useApp();
  const nav = useNavigation();
  return (
    <Card dashed style={{ alignItems: "center", overflow: "hidden" }}>
      <Sprinkles count={8} seed={3} opacity={0.6} />
      <Text style={{ fontSize: 38 }}>🥄</Text>
      <View style={{ backgroundColor: C.pink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginVertical: 6 }}>
        <Text style={{ fontFamily: F.heading, fontSize: 11, letterSpacing: 0.8, color: C.white }}>ONLY AT THE TIZZY KAR POP-UP</Text>
      </View>
      <H style={{ textAlign: "center" }}>Join the rewards program</H>
      <Muted style={{ textAlign: "center", marginVertical: 8, fontSize: 14 }}>
        Buy a collapsible spoon at {spoonWhere} — the only place spoons are sold ({spoonPrice}, one time) — then scan it here. Every visit after earns a punch: 5 = 10% off, 10 = a free scoop.
      </Muted>
      <Btn title={authUser ? "Scan & Link My Spoon" : "Sign Up Free"} icon={authUser ? "qr-code-outline" : "create-outline"} style={{ alignSelf: "stretch" }}
        onPress={() => authUser ? (onScan ? onScan() : nav.navigate("Scan", { mode: "link" })) : nav.navigate("SignUp")} />
      {!compact ? <Muted style={{ textAlign: "center", marginTop: 10 }}>Voting and events are free for everyone — no spoon needed.</Muted> : null}
    </Card>
  );
}

export function shadow(x, y, color) {
  return Platform.select({
    web: { boxShadow: `${x}px ${y}px 0 ${color}` },
    default: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 0, shadowOffset: { width: x, height: y }, elevation: 2 }
  });
}

const s = StyleSheet.create({
  roundBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,.22)", alignItems: "center", justifyContent: "center" }
});
