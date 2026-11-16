import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { OpenSans_400Regular, OpenSans_600SemiBold, OpenSans_700Bold } from "@expo-google-fonts/open-sans";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { AppProvider } from "./context/AppContext";
import RootNavigator from "./navigation/RootNavigator";
import { Toast, Confetti } from "./components/Overlays";
import { isConfigured } from "./lib/firebase";
import { C } from "./lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [loaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold, OpenSans_400Regular, OpenSans_600SemiBold, OpenSans_700Bold, Pacifico_400Regular });
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;
  if (!isConfigured) {
    return (
      <View style={{ flex: 1, backgroundColor: C.page, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: C.tqDark, fontSize: 16, textAlign: "center" }}>
          Firebase isn't configured yet. Copy frontend/.env.example to frontend/.env, fill in your Firebase web app keys, and restart.
        </Text>
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <RootNavigator />
        <Confetti />
        <Toast />
      </AppProvider>
    </SafeAreaProvider>
  );
}
