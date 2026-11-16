import React, { useState } from "react";
import { View, Text, Share, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { C, F } from "../lib/theme";
import { Screen, Band, Card, Btn, Muted, H, Field, ErrorText } from "../components/ui";

export default function ReferralScreen() {
  const { profile, toast, celebrate } = useApp();
  const [code, setCode] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const message = `Join me on Tizzy K's Spoon Rewards and use my code ${profile.referralCode} for extra cereal crunch!`;

  async function share() {
    if (Platform.OS === "web") { await Clipboard.setStringAsync(message); return toast("Copied — paste it anywhere to share.", "ok"); }
    try { await Share.share({ message }); } catch (e) {}
  }
  async function apply() {
    setError(""); setBusy(true);
    try { await api.applyReferral({ code: code.trim().toUpperCase() }); celebrate(); toast("Referral applied — a Referral Bonus is in your rewards!", "ok", 4000); setCode(""); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Band title="Invite friends" sub="You both get extra cereal crunch on your next scoop." tone="tq" right={false} back />
      <Card soft style={{ alignItems: "center" }}>
        <Muted style={{ fontFamily: F.bodyBold, letterSpacing: 1 }}>YOUR CODE</Muted>
        <Text selectable style={{ fontFamily: F.heading, color: C.tqDark, fontSize: 32, letterSpacing: 3 }}>{profile.referralCode}</Text>
        <Btn kind="white" small icon={Platform.OS === "web" ? "copy-outline" : "share-outline"} title={Platform.OS === "web" ? "Copy invite message" : "Share invite"} onPress={share} style={{ marginTop: 8 }} />
        <Muted style={{ marginTop: 10 }}>{profile.referralCount || 0} friend{profile.referralCount === 1 ? "" : "s"} joined with your code</Muted>
      </Card>
      {profile.referredBy ? <Muted style={{ textAlign: "center", marginTop: 16 }}>You joined with code {profile.referredBy} ✓</Muted> : (
        <View style={{ marginTop: 20 }}>
          <H size={16} style={{ marginBottom: 8 }}>Have a friend's code?</H>
          <Field code placeholder="SR-XXXXX" autoCapitalize="characters" value={code} onChangeText={t => setCode(t.toUpperCase())} />
          <ErrorText>{error}</ErrorText>
          <Btn kind="pink" title="Apply code" onPress={apply} loading={busy} />
        </View>
      )}
    </Screen>
  );
}
