// Tizzy K's brand: solid pink & turquoise blocks on pastel pink, turquoise type.
export const C = {
  page: "#FFE4EE",       // pastel pink pages
  card: "#FFF6F9",
  soft: "#FFD3E2",
  line: "#F8C3D5",
  pink: "#E8508E",
  pinkDark: "#B8336B",
  tq: "#0B9B96",         // turquoise blocks
  tqDark: "#077470",     // turquoise text
  tqMuted: "#2F807C",
  aqua: "#7EE8E4",       // logo scoop
  aquaSoft: "#BFF1EE",
  sun: "#FFD166",
  grape: "#B388EB",
  lime: "#8BD450",
  milk: "#FFF9F0",
  white: "#FFFFFF",
  danger: "#C94040",
  warnBg: "#FFF6D9",
  warnText: "#6B4B10"
};

export const F = {
  heading: "Poppins_700Bold",
  semi: "Poppins_600SemiBold",
  body: "OpenSans_400Regular",
  bodySemi: "OpenSans_600SemiBold",
  bodyBold: "OpenSans_700Bold",
  fun: "Pacifico_400Regular"
};

export const SPRINKLE_COLORS = [C.pink, C.tq, C.sun, C.white, C.grape, C.aqua];
export const PUNCH_COLORS = [C.pink, C.sun, C.tq, C.grape, C.lime];

export const RULES = {
  punchesForDiscount: 5,
  punchesForFreeScoop: 10,
  punchCooldownMs: 3 * 60 * 60 * 1000
};

export const SCHOOLS = [
  "Brown University",
  "Rhode Island School of Design (RISD)",
  "Johnson & Wales University",
  "Providence College",
  "Rhode Island College",
  "University of Rhode Island",
  "Community College of Rhode Island",
  "Bryant University",
  "Roger Williams University"
];
export const NOT_STUDENT = "Not a student";

export const REWARD_TYPES = {
  scoop:    { title: "Free Scoop",         icon: "ice-cream-outline", how: "Fill all 10 punches on your card." },
  ten:      { title: "10% Off Next Order", icon: "pricetag-outline",  how: "Reach 5 punches on your card." },
  bday:     { title: "Birthday Reward",    icon: "gift-outline",      how: "Add your birthday. It unlocks during your birthday month." },
  referral: { title: "Referral Bonus",     icon: "people-outline",    how: "Share your referral code. You and your friend each get one." }
};

export const SPOON_RE = /^TZK-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
export function normalizeSpoon(raw) {
  let s = String(raw || "").trim().toUpperCase();
  const m = s.match(/TZK[-\s]?[A-Z0-9]{4}[-\s]?[A-Z0-9]{4}/);
  if (m) s = m[0];
  s = s.replace(/[^A-Z0-9]/g, "");
  if (s.length === 11 && s.startsWith("TZK")) s = `TZK-${s.slice(3, 7)}-${s.slice(7)}`;
  return s;
}
