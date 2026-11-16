# Going live

About 1–2 hours of setup the first time, plus Apple's review (usually 1–3 days).

You'll need:
- A Google account for **Firebase**. Cloud Functions require the pay-as-you-go **Blaze plan**; a shop-sized loyalty program normally stays inside the free monthly allowance.
- An **Apple Developer** account ($99/year) for the App Store.
- A **Google Play Console** account ($25 once) if you want Android.
- Node 20+, then `npm i -g firebase-tools eas-cli`.

---

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** (e.g. `tizzyks-spoon-rewards`).
2. **Upgrade to Blaze** (bottom-left → Upgrade). Set a budget alert, e.g. $10/month.
3. **Build → Authentication → Get started**, then enable:
   - **Email/Password**
   - **Google** (choose a support email)
4. **Build → Firestore Database → Create database** → production mode → location `nam5 (us-central)` or `us-east1`.
5. **Project settings → General → Your apps → Add app → Web** (`</>`). Copy the config values; they go in `frontend/.env`.

## 2. Deploy the backend

```bash
cd backend
firebase login
cp .firebaserc.example .firebaserc   # replace your-firebase-project-id
(cd functions && npm install)
firebase deploy --only firestore,functions
```

This deploys the security rules, the index and all Cloud Functions (region `us-east1`, which you can change at the top of `functions/index.js` and in `EXPO_PUBLIC_FUNCTIONS_REGION`).

## 3. Load the menu and make yourself admin

Download a service-account key: **Project settings → Service accounts → Generate new private key**. Keep this file private and never commit it.

```bash
cd backend/scripts
npm install
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
node seed.js                                   # flavors, pop-ups (Brown, JWU, Hope St, RISD), events, shops, $5 spoon price
```

Sign up once in the app (step 4) with your own email, then:

```bash
node set-admin.js you@tizzyks.com              # sign out and back in → Profile → Admin panel
```

## 4. Configure and run the app

```bash
cd frontend
npm install
npx expo install --fix
cp .env.example .env      # paste the Firebase web config from step 1.5
npm run web               # check it locally at http://localhost:8081
```

### Google sign-in
In **Google Cloud console → APIs & Services → Credentials** (same project as Firebase):
- The **Web client ID** Firebase created → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- **Create OAuth client ID → iOS**, bundle ID `com.tizzyks.spoonrewards` → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- **Create OAuth client ID → Android**, package `com.tizzyks.spoonrewards` plus the SHA-1 that EAS shows (`eas credentials`) → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- In **Firebase → Authentication → Settings → Authorized domains**, add your website domain (step 5).

On phones, Google sign-in needs the real app build (step 6), not Expo Go. Email sign-up works everywhere.

## 5. Publish the website

```bash
cd frontend
npm run deploy:web        # exports to frontend/dist and deploys Firebase Hosting
```

You get `https://<project-id>.web.app`. To use your own domain (e.g. `rewards.tizzyks.com`): **Firebase → Hosting → Add custom domain**, add the DNS records it shows, then add the domain to Authentication's authorized domains.

On iPhone, people can open the site in Safari and use **Share → Add to Home Screen**.

## 6. Publish to the App Store (iOS)

```bash
cd frontend
eas login
eas init                  # creates the EAS project; copy the projectId into app.json → extra.eas.projectId
eas build --platform ios --profile production
```

EAS walks you through the Apple certificates. Then:

1. In **App Store Connect → My Apps → +** create “Spoon Rewards” with bundle ID `com.tizzyks.spoonrewards`.
2. Fill `eas.json → submit.production.ios` (your Apple ID email and the app's numeric App Store Connect ID).
3. `eas submit --platform ios --profile production`
4. In App Store Connect, add screenshots, a description and a privacy policy URL, then set the **App Privacy** answers: name, email, phone (optional), and purchase-history-style usage data, linked to the user and not used for tracking. **Submit for review.**

Push notifications on iOS work automatically through Expo's push service once the app is built with EAS.

Tip: `eas build --profile preview` makes an installable test build for TestFlight or internal testers first.

## 7. Google Play (Android, optional)

```bash
eas build --platform android --profile production
eas submit --platform android
```

Create the app in Play Console first, with package `com.tizzyks.spoonrewards`.

## 8. Print spoon QR codes

```bash
cd backend/scripts
node generate-spoons.js 200 "Spring 2027"
```

This writes `out/spoons-spring-2027.html` (a printable sticker sheet), one PNG per spoon in `out/png/`, and a CSV. Each code is registered when it's generated. Smaller batches can be made in the app under **Admin panel → Spoon QR codes**.

---

## Updating later

| Change | Command |
|---|---|
| Rules or functions | `cd backend && firebase deploy --only firestore,functions` |
| Website | `cd frontend && npm run deploy:web` |
| App (JS-only changes) | `eas update` (if you enable EAS Update), otherwise a new `eas build` + submit |
| Program rules (punches, cooldown, voucher time) | edit `RULES` at the top of `backend/functions/index.js` **and** `frontend/src/lib/theme.js`, then deploy both |

## Costs

| Item | Cost |
|---|---|
| Firebase (Blaze) | Typically $0 at this size; scheduled functions use Cloud Scheduler (3 free jobs) |
| Expo EAS | Free tier covers occasional builds |
| Apple Developer | $99/year |
| Google Play | $25 once |
| Custom domain | Whatever your registrar charges |
