import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false })
});

/** Asks permission and returns an Expo push token (iOS/Android), or "" when unavailable. */
export async function getPushToken() {
  if (Platform.OS === "web" || !Device.isDevice) return "";
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Spoon Rewards", importance: Notifications.AndroidImportance.DEFAULT });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return "";
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    const t = await Notifications.getExpoPushTokenAsync(projectId && !projectId.startsWith("REPLACE") ? { projectId } : undefined);
    return t?.data || "";
  } catch (e) { return ""; }
}
