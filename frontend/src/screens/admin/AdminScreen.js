import React, { useCallback, useEffect, useState } from "react";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../../context/AppContext";
import { api } from "../../lib/api";
import { C, F } from "../../lib/theme";
import { Screen, Band, Card, Btn, Muted, H, T, Field, SectionTitle, Bars, ErrorText } from "../../components/ui";

export const SECTIONS = {
  flavors: { label: "Flavors of the Week", fields: [["name", "Flavor name"], ["emoji", "Emoji"], ["desc", "Description"]] },
  popups:  { label: "Pop-up locations",    fields: [["name", "Location name"], ["address", "Address"], ["note", "Note (e.g. Saturday mornings)"]] },
  events:  { label: "Upcoming events",     fields: [["title", "Event title"], ["date", "Date (YYYY-MM-DD)"], ["time", "Time (e.g. 2–6 PM)"], ["place", "Place"]] },
  shops:   { label: "Scoop shops",         fields: [["name", "Shop name"], ["address", "Address"], ["note", "Note"]] },
  banners: { label: "Home banners",        fields: [["title", "Headline"], ["subtitle", "Subtext"], ["emoji", "Emoji"], ["color", "Color: pink or turquoise"]] }
};

export default function AdminScreen({ navigation }) {
  const { catalog, poll, weekId, saveCatalog, toast } = useApp();
  const [stats, setStats] = useState(null);
  const [flashText, setFlashText] = useState(catalog.settings?.flashSale?.text || "");
  const [price, setPrice] = useState(catalog.settings?.spoonPrice || "$5");
  const [redeem, setRedeem] = useState(""); const [redeemResult, setRedeemResult] = useState(null);
  const flash = catalog.settings?.flashSale || {};

  useFocusEffect(useCallback(() => { api.adminStats().then(setStats).catch(e => toast(e.message, "bad")); }, [])); // eslint-disable-line

  const lead = (kind) => {
    const list = (kind === "flavor" ? catalog.flavors?.items : catalog.popups?.items) || [];
    const counts = poll?.[`${kind}Counts`] || {};
    const top = [...list].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))[0];
    return top && counts[top.id] ? `${top.name} (${counts[top.id]})` : "No votes yet";
  };
  const settings = (patch) => saveCatalog("settings", { ...(catalog.settings || {}), ...patch });

  return (
    <Screen>
      <Band title="Admin panel" tone="tq" right={false} back />
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[[stats?.signups ?? "…", "Sign-ups"], [stats?.rewardsMembers ?? "…", "Rewards members"], [poll?.voters ?? 0, "Voters this week"]].map(([n, l]) => (
          <View key={l} style={{ flex: 1, backgroundColor: C.soft, borderRadius: 14, padding: 12, alignItems: "center" }}><H size={20}>{n}</H><Muted style={{ fontSize: 11, textAlign: "center" }}>{l}</Muted></View>
        ))}
      </View>
      <Card style={{ marginTop: 12 }}>
        {[["Leading flavor", lead("flavor")], ["Leading pop-up", lead("popup")], ["Voting week", weekId]].map(([k, v], i) => (
          <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}><Muted style={{ fontSize: 14 }}>{k}</Muted><T style={{ fontFamily: F.bodySemi, fontSize: 14 }}>{v}</T></View>
        ))}
      </Card>

      <SectionTitle>Members by school</SectionTitle>
      <Card>{stats ? <Bars color={C.tq} rows={Object.entries(stats.bySchool).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ id: k, label: k, count: v }))} /> : <Muted>Loading…</Muted>}</Card>

      <SectionTitle>Manage</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {Object.entries(SECTIONS).map(([k, v]) => (
          <Pressable key={k} onPress={() => navigation.navigate("AdminList", { section: k })} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bodySemi, color: C.tqDark, fontSize: 15 }}>{v.label}</Text><Muted>{(catalog[k]?.items || []).length} items</Muted></View>
            <Ionicons name="chevron-forward" size={18} color={C.tqMuted} />
          </Pressable>
        ))}
        <Pressable onPress={() => navigation.navigate("AdminSpoons")} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
          <Ionicons name="qr-code-outline" size={20} color={C.tqDark} style={{ marginRight: 10 }} />
          <Text style={{ flex: 1, fontFamily: F.bodySemi, color: C.tqDark, fontSize: 15 }}>Spoon QR codes · look up · unlink</Text>
          <Ionicons name="chevron-forward" size={18} color={C.tqMuted} />
        </Pressable>
      </Card>

      <SectionTitle>Check a reward code</SectionTitle>
      <Card>
        <Muted style={{ marginBottom: 8 }}>Type the code a customer shows you to confirm it's real and not expired.</Muted>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <Field style={{ flex: 1, marginBottom: 0 }} code placeholder="ABC123" autoCapitalize="characters" value={redeem} onChangeText={t => setRedeem(t.toUpperCase())} />
          <Btn small title="Check" onPress={async () => { try { setRedeemResult(await api.adminCheckRedemption({ code: redeem })); } catch (e) { toast(e.message, "bad"); } }} style={{ minHeight: 50 }} />
        </View>
        {redeemResult ? <T style={{ marginTop: 10, fontFamily: F.bodyBold, color: !redeemResult.found || redeemResult.expired ? C.danger : C.tqDark }}>
          {!redeemResult.found ? "Code not found." : redeemResult.expired ? `${redeemResult.title} — EXPIRED` : `✓ Valid: ${redeemResult.title}`}
        </T> : null}
      </Card>

      <SectionTitle>Flash sale</SectionTitle>
      <Card>
        <Field label="Message (shown on Home + sent as a push alert)" placeholder="Today only: 2-for-1 cones until 5 PM!" value={flashText} onChangeText={setFlashText} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Btn kind="pink" small style={{ flex: 1 }} title={flash.active ? "Update sale" : "Start sale"} onPress={async () => {
            if (!flashText.trim()) return toast("Add a message first.", "bad");
            try { await settings({ flashSale: { active: true, text: flashText.trim().slice(0, 140) } }); toast("Flash sale is live — push alert sent.", "ok"); } catch (e) { toast("Couldn't save.", "bad"); }
          }} />
          {flash.active ? <Btn kind="white" small style={{ flex: 1 }} title="End sale" onPress={() => settings({ flashSale: { active: false, text: flash.text } }).then(() => toast("Flash sale ended.", "ok"))} /> : null}
        </View>
      </Card>

      <SectionTitle>Spoon price</SectionTitle>
      <Card>
        <Field label="Shown on the welcome screen and sign-up" value={price} onChangeText={setPrice} />
        <Btn kind="white" small title="Save price" onPress={() => settings({ spoonPrice: price.trim().slice(0, 20) }).then(() => toast("Price saved.", "ok"))} />
      </Card>

      <SectionTitle>Weekly poll</SectionTitle>
      <Card>
        <Muted style={{ marginBottom: 10 }}>Starts fresh tallies for flavors and pop-ups. Everyone can vote again.</Muted>
        <Btn kind="white" title="Start a new voting week" onPress={async () => { try { const r = await api.adminStartNewWeek(); toast(`New voting week ${r.weekId} started.`, "ok"); } catch (e) { toast(e.message, "bad"); } }} />
      </Card>
    </Screen>
  );
}
