import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "../lib/theme";
import { Btn, Muted, H, Logo, Sprinkles } from "../components/ui";

/** Shown to staff after a reward is claimed. Live clock + motion make screenshots obvious. */
export default function VoucherScreen({ navigation, route }) {
  const { code, title, expiresAt } = route.params || {};
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { Animated.loop(Animated.timing(spin, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: Platform.OS !== "web" })).start(); }, []); // eslint-disable-line
  const expired = now > expiresAt;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <View style={{ flex: 1, backgroundColor: C.page, alignItems: "center", justifyContent: "center", padding: 24, paddingTop: insets.top + 24 }}>
      <Logo size={72} />
      <Text style={{ fontFamily: F.fun, color: C.tqDark, fontSize: 24, marginTop: 8 }}>Tizzy K's</Text>
      <H size={24} style={{ textAlign: "center", marginTop: 4 }}>{title}</H>
      <Muted style={{ fontSize: 14 }}>Show this screen to staff</Muted>
      <View style={{ backgroundColor: C.tq, borderRadius: 22, paddingVertical: 20, paddingHorizontal: 30, marginVertical: 20, alignItems: "center", overflow: "hidden", borderBottomWidth: 6, borderBottomColor: C.tqDark, width: "100%", maxWidth: 360 }}>
        <Sprinkles count={12} seed={4} opacity={0.5} />
        <Text style={{ fontFamily: F.heading, color: C.white, fontSize: 12, letterSpacing: 1.5 }}>REDEMPTION CODE</Text>
        <Text style={{ fontFamily: F.heading, color: C.white, fontSize: 42, letterSpacing: 6 }} selectable>{code}</Text>
      </View>
      <Text style={{ fontFamily: F.heading, color: C.tqDark, fontSize: 24 }}>{new Date(now).toLocaleTimeString()}</Text>
      <Text style={{ fontFamily: expired ? F.bodyBold : F.body, color: expired ? C.danger : C.tqMuted, fontSize: 14 }}>
        {expired ? "Expired" : `Valid until ${new Date(expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
      </Text>
      <Animated.Text style={{ fontSize: 32, marginVertical: 14, transform: [{ rotate }] }}>🍦</Animated.Text>
      <Btn kind="white" title="Done" style={{ alignSelf: "stretch", maxWidth: 360, width: "100%" }} onPress={() => navigation.goBack()} />
    </View>
  );
}
