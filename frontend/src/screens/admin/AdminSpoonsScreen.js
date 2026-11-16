import React, { useState } from "react";
import { View, Text, Platform, Share } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { useApp } from "../../context/AppContext";
import { api } from "../../lib/api";
import { C, F } from "../../lib/theme";
import { Screen, Band, Card, Btn, Field, Muted, H, T, SectionTitle, ErrorText } from "../../components/ui";

const PREFIX = "SPOONREWARDS:";

export default function AdminSpoonsScreen() {
  const { toast } = useApp();
  const [count, setCount] = useState("24");
  const [batch, setBatch] = useState("");
  const [codes, setCodes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [lookup, setLookup] = useState(""); const [found, setFound] = useState(null); const [lErr, setLErr] = useState("");

  async function generate() {
    setBusy(true);
    try { const r = await api.adminGenerateSpoons({ count: parseInt(count, 10) || 0, batch }); setCodes(r.codes); toast(`${r.codes.length} spoon codes registered. Save them now — they're only shown once.`, "ok", 5000); }
    catch (e) { toast(e.message, "bad"); }
    finally { setBusy(false); }
  }
  const csv = () => "code,qr_payload,batch\n" + codes.map(c => `${c},${PREFIX}${c},${batch.replace(/,/g, " ")}`).join("\n");

  async function exportCodes() {
    if (Platform.OS === "web") {
      const blob = new Blob([csv()], { type: "text/csv" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `spoon-codes-${Date.now()}.csv`; a.click();
      return;
    }
    try { await Share.share({ message: csv() }); } catch (e) {}
  }

  async function doLookup() {
    setLErr(""); setFound(null);
    try { setFound({ ...(await api.adminLookupSpoon({ code: lookup })), code: lookup }); } catch (e) { setLErr(e.message); }
  }
  async function unlink(retire) {
    try { await api.adminUnlinkSpoon({ code: found.code, retire }); toast(retire ? "Spoon unlinked and retired." : "Spoon unlinked — it can be linked again.", "ok"); doLookup(); }
    catch (e) { toast(e.message, "bad"); }
  }

  return (
    <Screen>
      <Band title="Spoon QR codes" tone="tq" right={false} back />
      <Muted style={{ fontSize: 14, marginBottom: 12 }}>Spoons are sold only at the Tizzy Kar pop-up. Each code is registered here; the first member to link it owns it. For big print runs, use backend/scripts/generate-spoons.js (makes PNG stickers and a printable sheet).</Muted>

      <Card>
        <H size={16}>Look up a spoon</H>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8, alignItems: "flex-start" }}>
          <Field style={{ flex: 1, marginBottom: 0 }} code placeholder="TZK-XXXX-XXXX" autoCapitalize="characters" value={lookup} onChangeText={t => setLookup(t.toUpperCase())} />
          <Btn small title="Find" onPress={doLookup} style={{ minHeight: 50 }} />
        </View>
        <ErrorText>{lErr}</ErrorText>
        {found ? (!found.registered ? <T style={{ color: C.danger, marginTop: 8 }}>Not a registered spoon.</T> : (
          <View style={{ marginTop: 10 }}>
            <T style={{ fontFamily: F.bodyBold }}>{found.disabled ? "Retired" : found.owner ? "Linked ✓" : "Registered — not linked yet (ready to sell)"}{found.batch ? ` · ${found.batch}` : ""}</T>
            {found.owner ? <>
              <Muted style={{ fontSize: 14, marginTop: 4 }}>{found.owner.name} · {found.owner.school || "—"} · {found.owner.email} · {found.owner.punches} punches</Muted>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Btn small kind="white" title="Unlink" onPress={() => unlink(false)} style={{ flex: 1 }} />
                <Btn small kind="pink" title="Unlink & retire" onPress={() => unlink(true)} style={{ flex: 1 }} />
              </View>
            </> : null}
          </View>
        )) : null}
      </Card>

      <SectionTitle>Register new spoons</SectionTitle>
      <Card>
        <Field label="How many codes?" keyboardType="number-pad" value={count} onChangeText={setCount} />
        <Field label="Batch label" hint="(optional)" placeholder="Fall 2026 spoons" value={batch} onChangeText={setBatch} />
        <Btn title="Generate & register codes" icon="qr-code-outline" loading={busy} onPress={generate} />
      </Card>

      {codes.length ? <>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Btn small kind="white" style={{ flex: 1 }} icon="download-outline" title={Platform.OS === "web" ? "Download CSV" : "Share CSV"} onPress={exportCodes} />
          <Btn small kind="white" style={{ flex: 1 }} icon="copy-outline" title="Copy codes" onPress={async () => { await Clipboard.setStringAsync(codes.join("\n")); toast("Codes copied.", "ok"); }} />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          {codes.map(c => (
            <View key={c} style={{ width: "30%", backgroundColor: C.white, borderRadius: 12, padding: 8, alignItems: "center", borderWidth: 1, borderColor: C.line }}>
              <QRCode value={PREFIX + c} size={84} color={C.tqDark} backgroundColor={C.white} />
              <Text style={{ fontFamily: F.semi, fontSize: 9.5, color: C.tqDark, marginTop: 4 }} selectable>{c}</Text>
            </View>
          ))}
        </View>
      </> : null}
    </Screen>
  );
}
