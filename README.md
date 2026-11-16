# Spoon Rewards — Tizzy K's Cereal Ice Cream

The loyalty app for Tizzy K's: a digital punch card linked to a collapsible spoon, rewards, and weekly flavor and pop-up voting. One codebase runs as an **iPhone app, an Android app and a website**.

- **Free account (anyone):** vote on Flavors of the Week and the next pop-up location, see events and shops.
- **Rewards members:** buy a **$5 collapsible spoon at the Tizzy Kar pop-up** (the only place spoons are sold), link it in the app, and scan it with every purchase. 5 punches = 10% off, 10 punches = a free scoop. Birthday and referral rewards too.
- **Admin panel:** edit flavors, pop-ups, events, shops and banners; run flash sales (sends push alerts); start a new voting week; register spoon QR codes; look up or unlink a spoon; verify a customer's reward code; see members by school.

## What's in this repo

```
spoon-rewards-app/
├── frontend/                 Expo (React Native) app — iOS, Android, web
│   ├── src/App.js            Fonts, providers, toasts, confetti
│   ├── src/navigation/       Welcome → sign-up/log-in → tabs (Home, Punch Card, Rewards, Vote, Profile)
│   ├── src/screens/          All screens (admin/ holds the admin panel)
│   ├── src/components/       Brand UI: color-block headers, sprinkles, punch grid, cereal-milk bowl
│   ├── src/context/          Live app state (Firestore listeners, auth)
│   ├── src/lib/              Firebase setup, server calls, theme, QR helpers, push
│   └── assets/               Tizzy K's logo, app icon, splash
├── backend/                  Firebase
│   ├── functions/index.js    Cloud Functions — all punch / spoon / reward / vote rules
│   ├── firestore.rules       Security rules
│   ├── database/seed-data.json  Starter menu (flavors, pop-ups incl. Johnson & Wales, events, shops)
│   └── scripts/              seed.js · set-admin.js · generate-spoons.js (QR sticker sheets)
└── docs/
    ├── DEPLOY.md             Step-by-step: Firebase, website, App Store, Google Play
    └── ADMIN.md              Running the program day to day
```

## How the rules are enforced

The app never writes punches, rewards, spoon links or votes itself. It calls Cloud Functions, which check everything on the server inside a transaction:

| Rule | Where |
|---|---|
| A spoon code must be registered by Tizzy K's | `linkSpoon`, `createProfile` |
| Each spoon belongs to exactly one profile; a replaced spoon is retired | `linkSpoon` |
| Only your own linked spoon earns punches; one punch per 3 hours | `logPunch` |
| 5 punches → 10% off; 10 → free scoop and a fresh card | `logPunch` |
| Rewards can be claimed once; code valid 15 minutes; staff can verify it | `claimReward`, `adminCheckRedemption` |
| One vote per category per week, free for every member | `castVote` |
| Birthday reward once a year in the birthday month (members only) | `birthdayRewards` (daily) |
| Referral bonus for both friends, once | `createProfile`, `applyReferral` |

Spoon codes are stored only as SHA-256 hashes, so a database leak doesn't expose valid codes.

## Quick start (local)

Requirements: Node 20+, `npm i -g firebase-tools eas-cli`, a Firebase project (see `docs/DEPLOY.md` step 1).

```bash
# 1. Backend
cd backend
cp .firebaserc.example .firebaserc        # put your Firebase project id in it
(cd functions && npm install)
(cd scripts && npm install)

# 2. App
cd ../frontend
npm install
npx expo install --fix                    # aligns native package versions with your Expo SDK
cp .env.example .env                      # paste your Firebase web config
npm run web                               # opens the website locally
npm run ios                               # iOS simulator (needs a Mac with Xcode)
```

To try everything without touching production, run the emulators (`cd backend/functions && npm run serve`), set `EXPO_PUBLIC_USE_EMULATORS=true` in `frontend/.env`, then seed them with `FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=<id> node backend/scripts/seed.js`.

Full go-live steps are in **[docs/DEPLOY.md](docs/DEPLOY.md)**.
