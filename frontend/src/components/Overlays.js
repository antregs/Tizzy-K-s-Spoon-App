import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, Animated, Dimensions, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F, SPRINKLE_COLORS } from "../lib/theme";
import { useApp } from "../context/AppContext";

const ND = Platform.OS !== "web";

/** App-wide toast (bottom). */
export function Toast() {
  const { toastState } = useApp();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(40)).current;
  useEffect(() => { if (toastState) { y.setValue(40); Animated.spring(y, { toValue: 0, useNativeDriver: ND }).start(); } }, [toastState?.id]); // eslint-disable-line
  if (!toastState) return null;
  const bg = toastState.kind === "bad" ? C.danger : C.tqDark;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 92, alignItems: "center" }}>
      <Animated.View accessibilityLiveRegion="polite" style={{ transform: [{ translateY: y }], backgroundColor: bg, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, maxWidth: 420 }}>
        <Text style={{ color: C.white, fontFamily: F.bodySemi, fontSize: 14, textAlign: "center" }}>{toastState.msg}</Text>
      </Animated.View>
    </View>
  );
}

/** Sprinkle confetti burst. Triggered by celebrate(). */
export function Confetti() {
  const { confettiKey } = useApp();
  if (!confettiKey) return null;
  return <Burst key={confettiKey} />;
}
function Burst() {
  const { width, height } = Dimensions.get("window");
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    x: width / 2 + (Math.random() - 0.5) * 80, dx: (Math.random() - 0.5) * width * 1.1, up: -(Math.random() * height * 0.35 + 80),
    rot: Math.random() * 720 - 360, color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length], h: 10 + Math.random() * 8
  })), [width, height]);
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(t, { toValue: 1, duration: 2600, useNativeDriver: ND }).start(); }, []); // eslint-disable-line
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
        const translateY = t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, p.up, height * 0.9] });
        const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rot}deg`] });
        const opacity = t.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
        return <Animated.View key={i} style={{ position: "absolute", left: p.x, top: height * 0.4, width: 5, height: p.h, borderRadius: 3, backgroundColor: p.color, opacity, transform: [{ translateX }, { translateY }, { rotate }] }} />;
      })}
    </View>
  );
}
