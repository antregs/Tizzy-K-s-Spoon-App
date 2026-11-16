import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { C, F, RULES } from "../lib/theme";
import { Screen, Band, Card, Btn, LinkBtn, Muted, T, H, Pill, JoinCard, Logo, Sprinkles, SectionTitle } from "../components/ui";
import PunchGrid from "../components/PunchGrid";

export default function PunchCardScreen({ navigation, route }) {
  const { profile, rewards, isMember, authUser } = useApp();
  if (!authUser) return (
    <Screen><Band title="My Punch Card" tone="tq" /><JoinCard /></Screen>
  );
  if (!isMember) return (
    <Screen><Band title="My Punch Card" sub="Join the rewards program to start earning" tone="tq" /><JoinCard /></Screen>
  );
  const p = profile.punches || 0;
  const next = (profile.lastPunchAt || 0) + RULES.punchCooldownMs;
  const ready = rewards.filter(r => r.status === "available").length;
  const pop = route.params?.pop ?? -1;

  return (
    <Screen>
      <Band title="My Punch Card" sub="Scan your spoon or log purchases to earn punches!" tone="tq" />
      <Card dashed style={{ overflow: "hidden", paddingBottom: 30 }}>
        <Sprinkles count={6} seed={9} opacity={0.7} />
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Logo size={40} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontFamily: F.fun, color: C.tqDark, fontSize: 20 }}>Tizzy K's</Text>
            <Muted style={{ fontFamily: F.bodySemi }}>Cereal Ice Cream · Spoon Card</Muted>
          </View>
          <Pill text={`${p} of 10`} kind="pink" />
        </View>
        <PunchGrid punches={p} popIndex={pop} />
      </Card>
      <View style={{ marginTop: 18 }}>
        <Btn title="Scan Spoon QR Code" icon="qr-code-outline" onPress={() => navigation.navigate("Scan", { mode: "punch" })} />
        <LinkBtn title="Log Purchase Manually" onPress={() => navigation.navigate("Scan", { mode: "punch", manual: true })} />
        {Date.now() < next ? <Muted style={{ textAlign: "center" }}>Next punch available after {new Date(next).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} (one per visit)</Muted> : null}
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        {[[profile.lifetimePunches || 0, "Lifetime punches"], [profile.cardsCompleted || 0, "Cards completed"], [ready, "Rewards ready"]].map(([n, l]) => (
          <View key={l} style={{ flex: 1, backgroundColor: C.soft, borderRadius: 14, padding: 12, alignItems: "center" }}>
            <H size={20}>{n}</H><Muted style={{ textAlign: "center", fontFamily: F.bodySemi, fontSize: 11 }}>{l}</Muted>
          </View>
        ))}
      </View>
      <SectionTitle>How it works</SectionTitle>
      <Card soft style={{ gap: 10 }}>
        {[["restaurant-outline", "Your collapsible spoon is a one-time purchase from the Tizzy Kar pop-up, with its own QR code linked only to your profile."],
          ["qr-code-outline", "After each purchase, scan your spoon's QR code (or type its code). One punch per visit."],
          ["gift-outline", "5 punches = 10% off. 10 punches = a free scoop in a blue waffle cone, and a fresh card."]].map(([i, t]) => (
          <View key={i} style={{ flexDirection: "row" }}><Ionicons name={i} size={20} color={C.tqDark} style={{ marginRight: 10 }} /><T style={{ flex: 1, fontSize: 13.5 }}>{t}</T></View>
        ))}
      </Card>
    </Screen>
  );
}
