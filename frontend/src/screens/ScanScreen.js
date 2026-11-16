import React, { useRef, useState } from "react";
import { View, Text, Platform, Pressable, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { pickAndDecodeQrWeb } from "../lib/qr";
import { C, F, SPOON_RE, normalizeSpoon } from "../lib/theme";
import { Screen, Band, Card, Btn, Field, ErrorText, Muted, H, LinkBtn } from "../components/ui";
import PunchGrid from "../components/PunchGrid";

/**
 * Modes:
 *   punch — scan your linked spoon to earn a punch (links it first if none)
 *   link  — link a spoon to your profile / replace a lost one
 *   fill  — just read a code and hand it back (sign-up form)
 */
export default function ScanScreen({ navigation, route }) {
  const { profile, toast, celebrate } = useApp();
  const insets = useSafeAreaInsets();
  const mode = route.params?.mode || "punch";
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const handled = useRef(false);
  const linking = mode === "link" || (mode === "punch" && profile && !profile.spoon);
  const live = Platform.OS !== "web" && !route.params?.manual;

  async function submit(raw) {
    const c = normalizeSpoon(raw);
    setError("");
    if (!SPOON_RE.test(c)) { setError("Spoon codes look like TZK-XXXX-XXXX."); handled.current = false; return; }
    if (mode === "fill") { route.params?.onCode?.(c); toast("Spoon code found ✓", "ok"); navigation.goBack(); return; }
    setBusy(true);
    try {
      if (linking) {
        const r = await api.linkSpoon({ code: c });
        celebrate();
        toast(r.joined ? "🥄 Welcome to Spoon Rewards! Scan your spoon with each purchase to earn punches." : "🥄 Spoon linked to your profile.", "ok", 5000);
        navigation.goBack();
      } else {
        const r = await api.logPunch({ code: c });
        if (r.completed) { celebrate(); setComplete(true); }
        else {
          if (r.unlockedDiscount) { celebrate(); toast("Halfway! 10% Off Next Order unlocked 🎉", "ok", 4000); }
          else toast(`Punch added! ${10 - r.punches} to go for a free scoop.`, "ok");
          navigation.navigate("Tabs", { screen: "Card", params: { pop: r.punches - 1 } });
        }
      }
    } catch (e) { setError(e.message); handled.current = false; }
    finally { setBusy(false); }
  }

  function onScanned({ data }) {
    if (handled.current || busy) return;
    handled.current = true;
    const c = normalizeSpoon(data);
    setCode(c); submit(c);
  }

  async function webPhoto() {
    setError("");
    try { const r = await pickAndDecodeQrWeb(); if (r === null) return setError("We couldn't find a QR code in that photo. Try closer up, or type the code below."); setCode(normalizeSpoon(r)); submit(r); }
    catch (e) { setError("Couldn't read that photo. Try another, or type the code."); }
  }

  const title = mode === "fill" ? "Scan your spoon" : linking ? "Link your spoon" : "Scan your spoon";
  const sub = linking ? "Scan the spoon you bought at the Tizzy Kar pop-up. It becomes yours." : mode === "fill" ? "Point the camera at the QR code on the handle." : "Scan the QR code on your spoon after your purchase.";

  return (
    <Screen>
      <Band title={title} sub={sub} tone={linking ? "pink" : "tq"} right={false} back />
      {live ? (
        permission?.granted ? (
          <View style={{ borderRadius: 22, overflow: "hidden", height: 320, backgroundColor: "#000", borderWidth: 4, borderColor: C.tq }}>
            <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={busy ? undefined : onScanned} />
            <View pointerEvents="none" style={{ position: "absolute", top: 60, bottom: 60, left: 60, right: 60, borderWidth: 3, borderColor: C.white, borderRadius: 20, borderStyle: "dashed" }} />
          </View>
        ) : (
          <Card style={{ alignItems: "center" }}>
            <Ionicons name="camera-outline" size={40} color={C.tq} />
            <H style={{ marginTop: 6 }}>Camera access needed</H>
            <Muted style={{ textAlign: "center", marginVertical: 8 }}>Allow the camera to scan your spoon, or type the code below.</Muted>
            <Btn title="Allow camera" small onPress={requestPermission} />
          </Card>
        )
      ) : Platform.OS === "web" ? (
        <Card style={{ alignItems: "center", borderStyle: "dashed", borderWidth: 3, borderColor: C.tq }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: C.tq, alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Ionicons name="camera" size={32} color={C.white} /></View>
          <H>Take a photo of the QR code</H>
          <Muted style={{ textAlign: "center", marginVertical: 6 }}>Hold the spoon flat so the code fills most of the picture.</Muted>
          <Btn title="Open camera / photos" icon="camera-outline" onPress={webPhoto} style={{ alignSelf: "stretch", marginTop: 6 }} loading={busy} />
        </Card>
      ) : null}

      <Muted style={{ textAlign: "center", marginVertical: 14, fontFamily: F.bodyBold, letterSpacing: 1 }}>{live || Platform.OS === "web" ? "OR TYPE THE CODE" : "TYPE THE CODE ON YOUR SPOON"}</Muted>
      <Field code placeholder="TZK-XXXX-XXXX" autoCapitalize="characters" autoCorrect={false} value={code} onChangeText={t => setCode(t.toUpperCase())} onSubmitEditing={() => submit(code)} error={!!error} />
      <ErrorText>{error}</ErrorText>
      <Btn title={mode === "fill" ? "Use this code" : linking ? "Link my spoon" : "Add my punch"} kind={linking ? "pink" : "tq"} loading={busy} onPress={() => submit(code)} />

      <Modal visible={complete} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.4)", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#FFEFF5", borderRadius: 26, padding: 22, width: "100%", maxWidth: 420, alignItems: "center" }}>
            <PunchGrid punches={10} allFull />
            <Text style={{ fontFamily: F.fun, color: C.pink, fontSize: 26, marginTop: 22 }}>Congrats!</Text>
            <H size={22} style={{ textAlign: "center" }}>You've earned a free scoop!</H>
            <Muted style={{ textAlign: "center", marginVertical: 10 }}>It's in My Rewards. A fresh punch card is ready for your next visit.</Muted>
            <Btn kind="pink" title="Claim Reward" style={{ alignSelf: "stretch" }} onPress={() => { setComplete(false); navigation.navigate("Tabs", { screen: "Rewards" }); }} />
            <LinkBtn title="Save it for later" onPress={() => { setComplete(false); navigation.navigate("Tabs", { screen: "Card" }); }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
