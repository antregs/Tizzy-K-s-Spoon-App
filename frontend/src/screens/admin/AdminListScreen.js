import React, { useState } from "react";
import { View } from "react-native";
import { useApp } from "../../context/AppContext";
import { C } from "../../lib/theme";
import { Screen, Band, Card, Btn, Field, LinkBtn, Muted, Empty } from "../../components/ui";
import { SECTIONS } from "./AdminScreen";

const slug = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || `item-${Date.now()}`;

export default function AdminListScreen({ route, navigation }) {
  const { section } = route.params;
  const sec = SECTIONS[section];
  const { catalog, saveCatalog, toast } = useApp();
  const [rows, setRows] = useState(() => (catalog[section]?.items || []).map(r => ({ ...r })));
  const [busy, setBusy] = useState(false);
  const main = sec.fields[0][0];

  async function save() {
    const used = new Set();
    const items = rows.filter(r => String(r[main] || "").trim()).map(r => {
      const o = {}; sec.fields.forEach(([k]) => { o[k] = String(r[k] || "").trim().slice(0, k === "desc" ? 160 : 90); });
      let id = r.id || slug(o[main]); while (used.has(id)) id += "-2"; used.add(id); o.id = id; return o;
    });
    setBusy(true);
    try { await saveCatalog(section, { ...(catalog[section] || {}), items }); toast("Saved — customers see it now.", "ok"); navigation.goBack(); }
    catch (e) { toast("Couldn't save — are you signed in as an admin?", "bad"); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Band title={sec.label} tone="pink" right={false} back />
      {rows.length ? rows.map((r, i) => (
        <Card key={i} style={{ marginBottom: 10 }}>
          {sec.fields.map(([k, label]) => (
            <Field key={k} placeholder={label} accessibilityLabel={label} value={r[k] || ""} style={{ marginBottom: 8 }}
              onChangeText={t => setRows(rs => rs.map((x, j) => j === i ? { ...x, [k]: t } : x))} />
          ))}
          <LinkBtn title="Remove" color={C.danger} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} onPress={() => setRows(rs => rs.filter((_, j) => j !== i))} />
        </Card>
      )) : <Card soft><Empty emoji="✨" text="Nothing yet — add the first one." /></Card>}
      <Btn kind="white" icon="add" title="Add" onPress={() => setRows(rs => [...rs, {}])} style={{ marginTop: 6 }} />
      <Btn title="Save & publish" icon="cloud-upload-outline" loading={busy} onPress={save} style={{ marginTop: 10 }} />
      {section === "flavors" ? <Muted style={{ marginTop: 10 }}>Renaming keeps existing votes. Use “Start a new voting week” on the admin home to reset tallies.</Muted> : null}
    </Screen>
  );
}
