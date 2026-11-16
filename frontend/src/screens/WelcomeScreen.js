import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { C, F } from "../lib/theme";
import { Btn, LinkBtn, Logo, Sprinkles } from "../components/ui";
import Bowl from "../components/Bowl";

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { browseAsGuest, spoonPrice, spoonWhere } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: C.tq }}>
      <Sprinkles count={40} seed={5} opacity={0.4} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", paddingTop: insets.top + 20 }}>
          <View style={{ paddingHorizontal: 26 }}>
            <Text style={{ fontFamily: F.fun, color: C.white, fontSize: 26 }}>Tizzy K's</Text>
            <Text style={{ fontFamily: F.heading, color: C.white, fontSize: 11, letterSpacing: 1.8 }}>CEREAL ICE CREAM · SPOON REWARDS</Text>
          </View>
          <View style={{ alignItems: "center", paddingHorizontal: 22, paddingVertical: 12, flex: 1, justifyContent: "center" }}>
            <Bowl width={280} />
            <View style={{ marginTop: -6 }}><Logo size={88} /></View>
            <Text style={{ fontFamily: F.heading, color: C.white, fontSize: 30, textAlign: "center", marginTop: 12, lineHeight: 36 }}>Welcome to Spoon Rewards!</Text>
            <Text style={{ fontFamily: F.body, color: C.white, fontSize: 16, textAlign: "center", marginTop: 8, maxWidth: 320 }}>Earn rewards, vote on flavors, and find our pop-ups near you.</Text>
            <Text style={{ fontFamily: F.fun, color: C.white, fontSize: 22, marginTop: 8 }}>Let's get started!</Text>
            <View style={{ marginTop: 16, backgroundColor: C.white, borderWidth: 3, borderColor: C.pink, borderBottomWidth: 7, borderBottomColor: C.pinkDark, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 18, maxWidth: 340, transform: [{ rotate: "-1.5deg" }], alignItems: "center" }}>
              <Text style={{ fontFamily: F.heading, color: C.pink, fontSize: 12, letterSpacing: 1 }}>🥄 SPOONS SOLD ONLY AT THE</Text>
              <Text style={{ fontFamily: F.fun, color: C.tqDark, fontSize: 26, lineHeight: 36 }}>Tizzy Kar pop-up</Text>
              <Text style={{ fontFamily: F.bodyBold, color: C.tqDark, fontSize: 13, textAlign: "center" }}>{spoonPrice} one-time purchase · unlocks punches & free scoops</Text>
              <Text style={{ fontFamily: F.body, color: C.tqMuted, fontSize: 12, marginTop: 6, textAlign: "center" }}>Voting on flavors & pop-ups is free for everyone</Text>
            </View>
          </View>
          <View style={{ backgroundColor: C.pink, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 6, borderTopColor: C.pinkDark, padding: 22, paddingBottom: insets.bottom + 22, gap: 12 }}>
            <Btn kind="white" icon="create-outline" title="Sign Up with Email" onPress={() => navigation.navigate("SignUp")} />
            <Btn kind="outline" icon="person-outline" title="Already a member? Log In" onPress={() => navigation.navigate("SignIn")} />
            <LinkBtn title="Skip for Now" color={C.white} onPress={browseAsGuest} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
