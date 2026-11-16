import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { C, F } from "../lib/theme";
import { Screen, Band, Card, Btn, Muted, H, JoinCard } from "../components/ui";

export default function MySpoonScreen({ navigation }) {
  const { profile, spoonWhere } = useApp();
  const sp = profile.spoon;
  return (
    <Screen>
      <Band title="My spoon" tone="pink" right={false} back />
      {sp ? (
        <>
          <Card style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.aquaSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Ionicons name="restaurant" size={26} color={C.tqDark} /></View>
            <View style={{ flex: 1 }}>
              <H size={17} style={{ letterSpacing: 1 }}>{sp.masked}</H>
              <Muted>Linked to your profile on {new Date(sp.linkedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</Muted>
            </View>
          </Card>
          <Muted style={{ marginVertical: 16, fontSize: 14 }}>Lost or broken your spoon? Buy a new one at {spoonWhere} and link it here — your punches and rewards stay with you. Your old spoon stops working.</Muted>
          <Btn kind="pink" icon="qr-code-outline" title="Link a new spoon" onPress={() => navigation.navigate("Scan", { mode: "link" })} />
        </>
      ) : <JoinCard />}
    </Screen>
  );
}
