// Generates unique spoon codes, registers them in Firestore (only a SHA-256
// hash of each code is stored), and writes:
//   out/spoons-<batch>.csv        code, QR payload
//   out/spoons-<batch>.html       printable sheet of QR stickers (Print → Save as PDF)
//   out/png/<code>.png            one QR image per spoon (for a sticker printer)
//
// Usage: node generate-spoons.js 100 "Fall 2026"
// The app can also do this from Admin panel → Spoon QR codes.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");
const admin = require("./firebase-admin-init");

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PREFIX = "SPOONREWARDS:";
const rand = n => Array.from(crypto.randomBytes(n), b => ALPHA[b % ALPHA.length]).join("");
const sha = s => crypto.createHash("sha256").update(s).digest("hex");

(async () => {
  const count = Math.max(1, Math.min(5000, parseInt(process.argv[2], 10) || 0));
  const batch = (process.argv[3] || new Date().toISOString().slice(0, 10)).slice(0, 60);
  if (!process.argv[2]) { console.error('Usage: node generate-spoons.js <count> ["batch label"]'); process.exit(1); }

  const db = admin.firestore();
  const codes = new Set();
  while (codes.size < count) codes.add(`TZK-${rand(4)}-${rand(4)}`);
  const list = [...codes];

  for (let i = 0; i < list.length; i += 400) {
    const b = db.batch();
    list.slice(i, i + 400).forEach(c => b.create(db.doc(`spoons/${sha(c)}`), {
      batch, createdAt: admin.firestore.FieldValue.serverTimestamp(), ownerUid: null, disabled: false
    }));
    await b.commit();
    console.log(`registered ${Math.min(i + 400, list.length)}/${list.length}`);
  }

  const slug = batch.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const out = path.join(__dirname, "out"); fs.mkdirSync(path.join(out, "png"), { recursive: true });
  fs.writeFileSync(path.join(out, `spoons-${slug}.csv`), "code,qr_payload,batch\n" + list.map(c => `${c},${PREFIX}${c},${batch}`).join("\n"));

  const cells = [];
  for (const c of list) {
    await QRCode.toFile(path.join(out, "png", `${c}.png`), PREFIX + c, { width: 600, margin: 2, color: { dark: "#077470", light: "#FFFFFF" } });
    const svg = await QRCode.toString(PREFIX + c, { type: "svg", margin: 1, color: { dark: "#077470", light: "#FFFFFF" } });
    cells.push(`<div class="c">${svg}<b>${c}</b><span>Tizzy K's Spoon Rewards</span></div>`);
  }
  fs.writeFileSync(path.join(out, `spoons-${slug}.html`), `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Spoon codes – ${batch}</title>
<style>body{font-family:Arial,sans-serif;margin:10mm;color:#077470}.g{display:grid;grid-template-columns:repeat(5,1fr);gap:5mm}
.c{border:1px dashed #E8508E;border-radius:3mm;padding:2mm;text-align:center;break-inside:avoid}.c svg{width:28mm;height:28mm}
.c b{display:block;font-size:10px;letter-spacing:1px}.c span{font-size:7px;color:#E8508E}h1{font-size:14px}@media print{h1{display:none}}</style></head>
<body><h1>${list.length} spoon codes · ${batch} — print with Ctrl/Cmd+P</h1><div class="g">${cells.join("")}</div></body></html>`);

  console.log(`\nDone. Files in ${out}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
