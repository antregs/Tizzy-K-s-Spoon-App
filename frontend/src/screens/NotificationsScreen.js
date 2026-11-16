import React from "react";
import { View, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { C, F } from "../lib/theme";
import { Screen, Band, Card, Muted, H, Empty, Btn } from "../components/ui";

export default function NotificationsScreen({ navigation }) {
  const { authUser, profile, rewards, catalog, myBallot, isMember } = useApp();
  const items = [];
  const flash = catalog.settings?.flashSale;
  if (flash?.active && flash.text) items.push({ icon: "flash", title: "Flash sale!", body: flash.text, go: "Home" });
  if (authUser && profile) {
    if (isMember && rewards.some(r => r.type === "bday" && r.status === "available")) items.push({ icon: "gift", title: "Happy birthday! 🎂", body: "Your Birthday Reward is ready in My Rewards.", go: "Rewards" });
    if ((catalog.flavors?.items || []).length && !myBallot?.flavor) items.push({ icon: "stats-chart", title: "This week's flavor poll is open", body: "Cast your vote for the next Flavor of the Week.", go: "Vote" });
    const n = isMember ? rewards.filter(r => r.status === "available").length : 0;
    if (n) items.push({ icon: "ice-cream", title: `You have ${n} reward${n > 1 ? "s" : ""} to use`, body: "Claim at the counter on your next visit.", go: "Rewards" });
  }
  return (
    <Screen>
      <Band title="Notifications" tone="pink" right={false} back />
      {!authUser ? <Muted style={{ fontSize: 14 }}>Sign up to get birthday rewards, flash-sale alerts and poll reminders.</Muted> :
        items.length ? <View style={{ gap: 10 }}>{items.map((n, i) => (
          <Pressable key={i} onPress={() => navigation.navigate("Tabs", { screen: n.go })}>
            <Card style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.soft, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Ionicons name={n.icon} size={20} color={C.pink} /></View>
              <View style={{ flex: 1 }}><H size={15}>{n.title}</H><Muted>{n.body}</Muted></View>
              <Ionicons name="chevron-forward" size={18} color={C.tqMuted} />
            </Card>
          </Pressable>
        ))}</View> : <Card soft><Empty emoji="🔔" text="You're all caught up." /></Card>}
      {authUser && profile && !profile.notifications ? <Muted style={{ marginTop: 14 }}>Push notifications are off. Turn them on in Profile → Settings.</Muted> : null}
      {Platform.OS === "web" && authUser ? <Muted style={{ marginTop: 14 }}>Push alerts arrive on the iPhone and Android apps; on the web they show here.</Muted> : null}
    </Screen>
  );
}
