import React, { useState } from "react";
import { View, Text, Pressable, Image, Switch, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useApp } from "../context/AppContext";
import { C, F } from "../lib/theme";
import { Screen, Band, Card, Btn, Muted, H, T, Segmented, SectionTitle, Empty, JoinCard } from "../components/ui";

const toMs = t => (t?.toMillis ? t.toMillis() : t || 0);
function when(t) {
  const ms = toMs(t); if (!ms) return "Just now";
  const d = Date.now() - ms;
  if (d < 60000) return "Just now"; if (d < 3600000) return `${Math.floor(d / 60000)} min ago`; if (d < 86400000) return `${Math.floor(d / 3600000)} hr ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
const DOT = { punch: ["restaurant", C.soft, C.pink], spoon: ["restaurant", C.aquaSoft, C.tqDark], earned: ["gift", C.aquaSoft, C.tqDark], redeemed: ["checkmark", C.aquaSoft, C.tqDark], vote: ["stats-chart", C.soft, C.pink] };

export default function ProfileScreen({ navigation }) {
  const { authUser, profile, activity, isAdmin, saveProfile, logout, toast } = useApp();
  const [tab, setTab] = useState("purchases");
  if (!authUser) return (
    <Screen>
      <Band title="My Account" />
      <Card soft style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 40 }}>🍦</Text><H>Make it yours</H>
        <Muted style={{ textAlign: "center", marginVertical: 8 }}>Sign up free to vote, then link a spoon from the Tizzy Kar pop-up to earn rewards.</Muted>
        <Btn title="Sign Up with Email" onPress={() => navigation.navigate("SignUp")} style={{ alignSelf: "stretch" }} />
        <Btn kind="white" title="Log In" onPress={() => navigation.navigate("SignIn")} style={{ alignSelf: "stretch", marginTop: 10 }} />
      </Card>
    </Screen>
  );

  const lists = {
    purchases: activity.filter(a => a.type === "punch" || a.type === "spoon"),
    rewards: activity.filter(a => a.type === "earned" || a.type === "redeemed"),
    votes: activity.filter(a => a.type === "vote")
  };
  const initials = (profile.name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const bday = profile.birthday ? new Date(profile.birthday + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "—";

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (r.canceled) return;
    try {
      const m = await ImageManipulator.manipulateAsync(r.assets[0].uri, [{ resize: { width: 240, height: 240 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true });
      await saveProfile({ photoURL: `data:image/jpeg;base64,${m.base64}` }); toast("Profile picture updated.", "ok");
    } catch (e) { toast("Couldn't use that image — try another.", "bad"); }
  }

  return (
    <Screen>
      <Band title="My Account" />
      <Card style={{ alignItems: "center" }}>
        <Pressable onPress={pickPhoto} accessibilityLabel="Change profile picture" style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: C.pink, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 4, borderColor: C.white }}>
          {profile.photoURL ? <Image source={{ uri: profile.photoURL }} style={{ width: 88, height: 88 }} /> : <Text style={{ fontFamily: F.heading, color: C.white, fontSize: 30 }}>{initials}</Text>}
        </Pressable>
        <H size={20} style={{ marginTop: 10 }}>{profile.name}</H>
        <Muted>Member since {new Date(toMs(profile.memberSince) || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</Muted>
        <View style={{ alignSelf: "stretch", marginTop: 10 }}>
          {[["Email", profile.email || "—"], ["School", profile.school || "—"], ["Phone", profile.phone || "—"], ["Birthday", bday], ["Referral code", profile.referralCode], ["My spoon", profile.spoon ? `${profile.spoon.masked} ✓` : "Not linked"]].map(([k, v], i) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <T style={{ color: C.tqMuted, fontSize: 14 }}>{k}</T><T style={{ fontFamily: F.bodySemi, fontSize: 14, flexShrink: 1, textAlign: "right" }}>{v}</T>
            </View>
          ))}
        </View>
      </Card>
      {!profile.spoon ? <View style={{ marginTop: 16 }}><JoinCard compact /></View> : null}

      <SectionTitle>Activity</SectionTitle>
      <Segmented value={tab} onChange={setTab} options={[{ value: "purchases", label: "Purchases" }, { value: "rewards", label: "Rewards" }, { value: "votes", label: "Votes" }]} />
      <Card style={{ marginTop: 10 }}>
        {lists[tab].length ? lists[tab].slice(0, 25).map((a, i) => {
          const [icon, bg, fg] = DOT[a.type] || DOT.punch;
          return (
            <View key={a.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: bg, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Ionicons name={icon} size={17} color={fg} /></View>
              <View style={{ flex: 1 }}><T style={{ fontFamily: F.bodySemi, fontSize: 14 }}>{a.label}</T><Muted>{when(a.at)}</Muted></View>
            </View>
          );
        }) : <Empty emoji="🥄" text="Nothing here yet." />}
      </Card>

      <SectionTitle>Settings</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <Row icon="create-outline" label="Edit profile" onPress={() => navigation.navigate("EditProfile")} />
        <Row icon="notifications-outline" label="Notifications" sub="Birthday rewards, flash sales, poll reminders"
          right={<Switch value={!!profile.notifications} onValueChange={v => saveProfile({ notifications: v, ...(v ? {} : { pushToken: "" }) })} trackColor={{ true: C.tq, false: C.line }} thumbColor={Platform.OS === "android" ? C.white : undefined} />} />
        <Row icon="restaurant-outline" label="My spoon" sub={profile.spoon ? "Replace a lost spoon" : "Link your spoon to start earning"} onPress={() => navigation.navigate("MySpoon")} />
        <Row icon="share-social-outline" label="Invite friends" onPress={() => navigation.navigate("Referral")} />
        {isAdmin ? <Row icon="shield-checkmark-outline" label="Admin panel" onPress={() => navigation.navigate("Admin")} /> : null}
        <Row icon="log-out-outline" label="Logout" danger onPress={logout} last />
      </Card>
    </Screen>
  );
}

function Row({ icon, label, sub, onPress, right, danger, last }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.line }}>
      <Ionicons name={icon} size={21} color={danger ? C.danger : C.tqDark} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.bodySemi, color: danger ? C.danger : C.tqDark, fontSize: 15 }}>{label}</Text>
        {sub ? <Muted>{sub}</Muted> : null}
      </View>
      {right || (onPress ? <Ionicons name="chevron-forward" size={18} color={C.tqMuted} /> : null)}
    </Pressable>
  );
}
