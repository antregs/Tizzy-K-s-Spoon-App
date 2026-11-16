import React, { useState } from "react";
import { View, Text, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { C, F, REWARD_TYPES } from "../lib/theme";
import { Screen, Band, Card, Btn, LinkBtn, Muted, H, Pill, JoinCard, Notice, SectionTitle, Empty } from "../components/ui";

const ICON_BG = { scoop: [C.soft, C.pink], ten: [C.aquaSoft, C.tqDark], bday: ["#FFF0C2", "#C98A00"], referral: ["#E9DDFB", "#7A55C9"] };
const toMs = t => (t?.toMillis ? t.toMillis() : t || 0);

export default function RewardsScreen({ navigation }) {
  const { authUser, isMember, rewards, toast } = useApp();
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!authUser) return <Screen><Band title="My Rewards" /><JoinCard /></Screen>;

  const avail = rewards.filter(r => r.status === "available");
  const used = rewards.filter(r => r.status === "redeemed").sort((a, b) => toMs(b.redeemedAt) - toMs(a.redeemedAt));

  if (!isMember) return (
    <Screen>
      <Band title="My Rewards" sub="For Spoon Rewards members" />
      {avail.length ? <Notice icon="gift-outline">You have {avail.length} reward{avail.length > 1 ? "s" : ""} waiting — link a spoon to unlock {avail.length > 1 ? "them" : "it"}.</Notice> : null}
      <JoinCard />
      <SectionTitle>What members get</SectionTitle>
      <View style={{ gap: 10 }}>{Object.entries(REWARD_TYPES).map(([k, t]) => <RewardRow key={k} type={k} title={t.title} sub={t.how} />)}</View>
    </Screen>
  );

  async function claim() {
    setBusy(true);
    try { const r = await api.claimReward({ rewardId: confirm.id }); setConfirm(null); navigation.navigate("Voucher", r); }
    catch (e) { toast(e.message, "bad"); setConfirm(null); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Band title="My Rewards" sub={avail.length ? `${avail.length} ready to claim` : "Keep scooping to unlock rewards"} />
      <View style={{ gap: 10 }}>
        {Object.entries(REWARD_TYPES).map(([k, t]) => {
          const mine = avail.filter(r => r.type === k);
          return <RewardRow key={k} type={k} title={t.title} count={mine.length}
            sub={mine.length ? mine[0].desc : t.how}
            action={mine.length ? <Btn kind="pink" small title="Claim Now" onPress={() => setConfirm(mine[0])} /> : <Pill text="Locked" kind="soft" />} />;
        })}
      </View>
      <SectionTitle>Redeemed rewards</SectionTitle>
      {used.length ? (
        <Card>
          {used.map((r, i) => (
            <View key={r.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <Ionicons name="checkmark-circle" size={24} color={C.tq} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}><H size={14}>{r.title}</H><Muted>{new Date(toMs(r.redeemedAt)).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · code {r.code}</Muted></View>
            </View>
          ))}
        </Card>
      ) : <Card soft><Empty emoji="🎁" text="No rewards redeemed yet." /></Card>}

      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.4)", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#FFEFF5", borderRadius: 26, padding: 24, width: "100%", maxWidth: 400, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>🍨</Text>
            <H size={21} style={{ textAlign: "center", marginTop: 6 }}>Claim {confirm?.title}?</H>
            <Muted style={{ textAlign: "center", marginVertical: 10, fontSize: 14 }}>Only claim at the counter — you'll get a code to show staff, valid for 15 minutes.</Muted>
            <Btn kind="pink" title="Claim Now" loading={busy} onPress={claim} style={{ alignSelf: "stretch" }} />
            <LinkBtn title="Not yet" onPress={() => setConfirm(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function RewardRow({ type, title, sub, action, count }) {
  const [bg, fg] = ICON_BG[type];
  return (
    <Card style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bg, alignItems: "center", justifyContent: "center", marginRight: 14 }}><Ionicons name={REWARD_TYPES[type].icon} size={28} color={fg} /></View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><H size={15}>{title}</H>{count > 1 ? <Pill text={`×${count}`} /> : null}</View>
        <Muted>{sub}</Muted>
      </View>
      {action}
    </Card>
  );
}
