import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Platform } from "react-native";
import { C, F, PUNCH_COLORS } from "../lib/theme";

/** 10 punch holes; filled ones are colorful cereal rings. */
export default function PunchGrid({ punches, popIndex = -1, allFull = false }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 22 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <Hole key={i} index={i} full={allFull || i < punches} pop={i === popIndex || allFull} delay={allFull ? i * 60 : 0} />
      ))}
    </View>
  );
}

function Hole({ index, full, pop, delay }) {
  const scale = useRef(new Animated.Value(pop ? 0.2 : 1)).current;
  useEffect(() => {
    if (!pop) return;
    scale.setValue(0.2);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, delay, useNativeDriver: Platform.OS !== "web" }).start();
  }, [pop]); // eslint-disable-line
  const color = PUNCH_COLORS[index % PUNCH_COLORS.length];
  const label = index === 4 ? "10% OFF" : index === 9 ? "FREE SCOOP" : null;
  return (
    <View style={{ width: "18%", alignItems: "center" }}>
      <Animated.View style={{ width: "100%", aspectRatio: 1, borderRadius: 999, alignItems: "center", justifyContent: "center", transform: [{ scale }],
        ...(full ? { backgroundColor: color, borderBottomWidth: 4, borderBottomColor: "rgba(0,0,0,.14)" } : { borderWidth: 2.5, borderStyle: "dashed", borderColor: "rgba(7,116,112,.32)", backgroundColor: C.card }) }}
        accessibilityLabel={`Punch ${index + 1} ${full ? "earned" : "empty"}`}>
        {full ? <View style={{ width: "34%", aspectRatio: 1, borderRadius: 999, backgroundColor: C.milk }} /> :
          <Text style={{ fontFamily: F.semi, color: "rgba(7,116,112,.4)", fontSize: 14 }}>{index + 1}</Text>}
      </Animated.View>
      {label ? <Text style={{ position: "absolute", bottom: -17, fontFamily: F.heading, fontSize: 9, color: C.tqDark, width: 90, textAlign: "center" }}>{label}</Text> : null}
    </View>
  );
}
