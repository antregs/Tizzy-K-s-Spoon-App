import React, { useState } from "react";
import { View, Text, Linking, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { C, F } from "../lib/theme";
import { Screen, Band, Card, Btn, Muted, H, Segmented, SectionTitle, Bars, Empty } from "../components/ui";

export default function VoteScreen({ navigation }) {
  const { catalog, poll, myBallot, weekId, authUser, toast, celebrate } = useApp();
  const [tab, setTab] = useState("flavor");
  const [busyId, setBusyId] = useState(null);
  const list = (tab === "flavor" ? catalog.flavors?.items : catalog.popups?.items) || [];
  const counts = poll?.[`${tab}Counts`] || {};
  const mine = myBallot?.[tab];
  const rows = list.map(o => ({ id: o.id, label: `${tab === "flavor" ? (o.emoji || "") + " " : ""}${o.name}`, count: counts[o.id] || 0 })).sort((a, b) => b.count - a.count);
  const total = rows.reduce((a, r) => a + r.count, 0);

  async function vote(o) {
    if (!authUser) return navigation.navigate("SignUp");
    setBusyId(o.id);
    try { await api.castVote({ kind: tab, optionId: o.id }); celebrate(); toast(`Thanks for voting for ${o.name}!`, "ok"); }
    catch (e) { toast(e.message, "bad"); }
    finally { setBusyId(null); }
  }

  return (
    <Screen>
      <Band title="Cast Your Vote!" sub={`Voting week #${(weekId.split("-W")[1] || weekId)} · one vote per category`} tone="tq" />
      <Segmented value={tab} onChange={setTab} options={[{ value: "flavor", label: "Flavors of the Week" }, { value: "popup", label: "Next Pop-Up Location" }]} />
      <View style={{ gap: 10, marginTop: 16 }}>
        {list.length ? list.map(o => (
          <Card key={o.id}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.soft, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                {tab === "flavor" ? <Text style={{ fontSize: 28 }}>{o.emoji || "🍨"}</Text> : <Ionicons name="location" size={24} color={C.pink} />}
              </View>
              <View style={{ flex: 1 }}><H size={15}>{o.name}</H><Muted>{tab === "flavor" ? o.desc : [o.address, o.note].filter(Boolean).join(" · ")}</Muted></View>
            </View>
            <View style={{ marginTop: 12 }}>
              {mine === o.id ? (
                <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: C.aquaSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="checkmark" size={18} color={C.tqDark} /><Text style={{ fontFamily: F.bodyBold, color: C.tqDark, marginLeft: 6 }}>Your vote</Text>
                </View>
              ) : !mine ? <Btn kind="pink" small title={authUser ? "Vote" : "Sign up free to vote"} loading={busyId === o.id} onPress={() => vote(o)} /> : null}
              {tab === "popup" && o.address ? (
                <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`)} style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: F.bodySemi, color: C.tqDark, fontSize: 13, textDecorationLine: "underline" }}>📍 Open in Maps →</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        )) : <Card soft><Empty emoji="🗳️" text={`No ${tab === "flavor" ? "flavors" : "locations"} on the ballot this week.`} /></Card>}
      </View>
      {list.length ? <>
        <SectionTitle right={<Muted style={{ fontFamily: F.bodySemi }}>{total} vote{total === 1 ? "" : "s"}</Muted>}>Live results</SectionTitle>
        <Card><Bars rows={rows} mine={mine} /></Card>
      </> : null}
    </Screen>
  );
}
