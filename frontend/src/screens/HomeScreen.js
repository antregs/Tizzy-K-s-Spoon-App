import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Linking, Animated, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { C, F, RULES } from "../lib/theme";
import { Screen, Band, Card, SectionTitle, Btn, Muted, T, H, Pill, ProgressBar, JoinCard, Sprinkles, Empty } from "../components/ui";

const mapsUrl = a => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;

export default function HomeScreen({ navigation }) {
  const { profile, rewards, catalog, isMember, authUser } = useApp();
  const first = (profile?.name || "").split(" ")[0] || "there";
  const ready = rewards.filter(r => r.status === "available").length;
  const p = profile?.punches || 0;
  const banners = catalog.banners?.items || [];
  const today = new Date().toISOString().slice(0, 10);
  const events = (catalog.events?.items || []).filter(e => !e.date || e.date >= today).sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 5);
  const shops = catalog.shops?.items || [];
  const flash = catalog.settings?.flashSale;

  return (
    <Screen>
      <Band title={`Hi ${authUser ? first : "there"}!`} sub={!authUser ? "Browsing as a guest" : !isMember ? "Free member · voting unlocked" : ready ? `You have ${ready} reward${ready > 1 ? "s" : ""} ready to use` : "Welcome back to Tizzy K's"} />
      {flash?.active && flash.text ? (
        <View style={{ backgroundColor: C.pink, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 14, borderBottomWidth: 4, borderBottomColor: C.pinkDark }}>
          <Ionicons name="flash" size={20} color={C.white} />
          <View style={{ marginLeft: 10, flex: 1 }}><Text style={{ fontFamily: F.heading, color: C.white }}>Flash sale</Text><Text style={{ fontFamily: F.body, color: C.white, fontSize: 13 }}>{flash.text}</Text></View>
        </View>
      ) : null}
      <BannerCarousel items={banners} />

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <QuickAction color={C.tq} edge={C.tqDark} icon="qr-code-outline" label="Track My Purchases" onPress={() => navigation.navigate("Card")} />
        <QuickAction color={C.pink} edge={C.pinkDark} icon="gift-outline" label="Redeem Rewards" onPress={() => navigation.navigate("Rewards")} />
        <QuickAction color={C.tq} edge={C.tqDark} icon="stats-chart-outline" label="Vote Now" onPress={() => navigation.navigate("Vote")} />
      </View>

      <View style={{ marginTop: 20 }}>
        {!authUser ? (
          <Card soft style={{ alignItems: "center" }}>
            <H style={{ textAlign: "center" }}>Join the fun — it's free</H>
            <Muted style={{ textAlign: "center", marginVertical: 8 }}>Sign up to vote on flavors and pop-ups. Add a spoon from the Tizzy Kar pop-up anytime to earn rewards.</Muted>
            <Btn title="Sign Up with Email" onPress={() => navigation.navigate("SignUp")} style={{ alignSelf: "stretch" }} />
          </Card>
        ) : !isMember ? <JoinCard compact /> : (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <H size={16}>{RULES.punchesForFreeScoop - p === 1 ? "Just 1 punch away from a free scoop!" : `You're ${RULES.punchesForFreeScoop - p} punches away from a free scoop!`}</H>
                <Muted>{p < RULES.punchesForDiscount ? `${RULES.punchesForDiscount - p} more for 10% off your next order` : "10% off unlocked on this card ✓"}</Muted>
              </View>
              <Pill text={`${p}/10`} />
            </View>
            <ProgressBar value={p} max={RULES.punchesForFreeScoop} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Muted>0</Muted><Muted>5 · 10% off</Muted><Muted>10 · Free scoop</Muted>
            </View>
          </Card>
        )}
      </View>

      {shops.length ? <>
        <SectionTitle>Our scoop shops</SectionTitle>
        <Card style={{ gap: 12 }}>
          {shops.map(s => (
            <Pressable key={s.id} onPress={() => s.address && Linking.openURL(mapsUrl(s.address))} style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: C.soft, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Ionicons name="location" size={22} color={C.pink} /></View>
              <View style={{ flex: 1 }}><H size={15}>{s.name}</H><Muted>{s.note}</Muted>{s.address ? <Text style={{ fontFamily: F.bodySemi, color: C.tqDark, fontSize: 13, textDecorationLine: "underline" }}>{s.address} →</Text> : null}</View>
            </Pressable>
          ))}
        </Card>
      </> : null}

      <SectionTitle>Upcoming events</SectionTitle>
      {events.length ? (
        <Card style={{ gap: 12 }}>
          {events.map(e => {
            const d = e.date ? new Date(e.date + "T12:00:00") : null;
            return (
              <View key={e.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 52, height: 56, borderRadius: 14, backgroundColor: C.aquaSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Text style={{ fontFamily: F.semi, fontSize: 11, color: C.tqDark }}>{d ? d.toLocaleDateString(undefined, { month: "short" }).toUpperCase() : "TBA"}</Text>
                  <Text style={{ fontFamily: F.heading, fontSize: 20, color: C.tqDark }}>{d ? d.getDate() : "–"}</Text>
                </View>
                <View style={{ flex: 1 }}><H size={15}>{e.title}</H><Muted>{[e.time, e.place].filter(Boolean).join(" · ")}</Muted></View>
              </View>
            );
          })}
        </Card>
      ) : <Card soft><Empty emoji="📅" text="No pop-ups scheduled yet — check back soon!" /></Card>}
    </Screen>
  );
}

function QuickAction({ color, edge, icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flex: 1, minHeight: 96, borderRadius: 18, backgroundColor: color, borderBottomWidth: pressed ? 2 : 5, borderBottomColor: edge, alignItems: "center", justifyContent: "center", padding: 8, overflow: "hidden", marginTop: pressed ? 3 : 0 })}>
      <Sprinkles count={6} seed={label.length} opacity={0.45} />
      <Ionicons name={icon} size={26} color={C.white} />
      <Text style={{ fontFamily: F.semi, color: C.white, fontSize: 13, textAlign: "center", marginTop: 6 }}>{label}</Text>
    </Pressable>
  );
}

function BannerCarousel({ items }) {
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: Platform.OS !== "web" }).start(() => {
        setI(x => (x + 1) % items.length);
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== "web" }).start();
      });
    }, 4500);
    return () => clearInterval(t);
  }, [items.length]); // eslint-disable-line
  if (!items.length) return null;
  const b = items[i % items.length];
  const bg = b.color === "pink" ? C.pink : C.tq;
  return (
    <View style={{ height: 150, borderRadius: 22, backgroundColor: bg, overflow: "hidden", borderBottomWidth: 5, borderBottomColor: b.color === "pink" ? C.pinkDark : C.tqDark }}>
      <Sprinkles count={14} seed={i + 2} opacity={0.45} />
      <Animated.View style={{ flex: 1, flexDirection: "row", alignItems: "center", padding: 20, opacity: fade }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.heading, color: C.white, fontSize: 20, lineHeight: 25 }}>{b.title}</Text>
          <Text style={{ fontFamily: F.body, color: C.white, fontSize: 13, marginTop: 4 }}>{b.subtitle}</Text>
        </View>
        <Text style={{ fontSize: 56 }}>{b.emoji || "🍦"}</Text>
      </Animated.View>
      <View style={{ position: "absolute", left: 20, bottom: 10, flexDirection: "row", gap: 6 }}>
        {items.map((_, k) => <View key={k} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? C.white : "rgba(255,255,255,.5)" }} />)}
      </View>
    </View>
  );
}
