import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { C, F } from "../lib/theme";
import { Logo, Sprinkles } from "../components/ui";

import WelcomeScreen from "../screens/WelcomeScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SignInScreen from "../screens/SignInScreen";
import CompleteProfileScreen from "../screens/CompleteProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import PunchCardScreen from "../screens/PunchCardScreen";
import ScanScreen from "../screens/ScanScreen";
import RewardsScreen from "../screens/RewardsScreen";
import VoucherScreen from "../screens/VoucherScreen";
import VoteScreen from "../screens/VoteScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import MySpoonScreen from "../screens/MySpoonScreen";
import ReferralScreen from "../screens/ReferralScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import AdminScreen from "../screens/admin/AdminScreen";
import AdminListScreen from "../screens/admin/AdminListScreen";
import AdminSpoonsScreen from "../screens/admin/AdminSpoonsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.page, card: C.page, text: C.tqDark, primary: C.tq, border: C.line } };

const linking = {
  prefixes: ["spoonrewards://"],
  config: { screens: {
    Welcome: "welcome", SignUp: "signup", SignIn: "login",
    Tabs: { screens: { Home: "home", Card: "card", Rewards: "rewards", Vote: "vote", Profile: "profile" } },
    Admin: "admin"
  } }
};

function Tabs() {
  const insets = useSafeAreaInsets();
  const icons = { Home: "home", Card: "card", Rewards: "gift", Vote: "stats-chart", Profile: "person" };
  const labels = { Home: "Home", Card: "Punch Card", Rewards: "Rewards", Vote: "Vote", Profile: "Profile" };
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? icons[route.name] : `${icons[route.name]}-outline`} size={22} color={color} />,
      tabBarLabel: labels[route.name],
      tabBarActiveTintColor: C.white, tabBarInactiveTintColor: C.tqMuted,
      tabBarActiveBackgroundColor: C.tq,
      tabBarLabelStyle: { fontFamily: F.bodySemi, fontSize: 11 },
      tabBarItemStyle: { borderRadius: 14, marginHorizontal: 3, marginVertical: 6 },
      tabBarStyle: { backgroundColor: C.page, borderTopColor: C.line, height: 68 + insets.bottom, paddingBottom: insets.bottom, paddingHorizontal: 4 }
    })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Card" component={PunchCardScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Vote" component={VoteScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: C.tq, alignItems: "center", justifyContent: "center" }}>
      <Sprinkles count={30} seed={11} opacity={0.5} />
      <Logo size={96} />
      <Text style={{ fontFamily: F.fun, color: C.white, fontSize: 28, marginTop: 12 }}>Spoon Rewards</Text>
      <ActivityIndicator color={C.white} style={{ marginTop: 16 }} />
    </View>
  );
}

export default function RootNavigator() {
  const { authUser, profile, guest, isAdmin } = useApp();
  const loading = authUser === undefined || (authUser && profile === undefined);
  if (loading) return <Splash />;
  const needsProfile = authUser && profile === null;
  const inApp = (authUser && profile) || (!authUser && guest);

  return (
    <NavigationContainer theme={navTheme} linking={linking} documentTitle={{ formatter: () => "Spoon Rewards – Tizzy K's" }}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.page } }}>
        {needsProfile ? (
          <>
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: "modal" }} />
          </>
        ) : inApp ? (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: "modal" }} />
            <Stack.Screen name="Voucher" component={VoucherScreen} options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: "modal" }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="MySpoon" component={MySpoonScreen} />
            <Stack.Screen name="Referral" component={ReferralScreen} />
            {!authUser ? <>
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen name="SignIn" component={SignInScreen} />
            </> : null}
            {isAdmin ? <>
              <Stack.Screen name="Admin" component={AdminScreen} />
              <Stack.Screen name="AdminList" component={AdminListScreen} />
              <Stack.Screen name="AdminSpoons" component={AdminSpoonsScreen} />
            </> : null}
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: "modal" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
