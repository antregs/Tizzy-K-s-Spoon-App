# Running Spoon Rewards day to day

Everything below is in the app: **Profile → Admin panel**. Only accounts you've made admin can see it (`node backend/scripts/set-admin.js email`).

## Selling spoons at the Tizzy Kar
1. Print codes ahead of time (`node generate-spoons.js 200 "Batch name"`, or Admin panel → Spoon QR codes) and stick one on each collapsible spoon.
2. A customer pays $5 for a spoon at the Tizzy Kar.
3. They scan it in the app, at sign-up or later from the Punch Card. The spoon is now theirs, and nobody else can link or use it.

## Every purchase
The customer scans their own spoon after paying and gets one punch, at most once every 3 hours. At 5 punches they unlock 10% off; at 10, a free scoop and a fresh card.

## Redeeming rewards at the register
The customer taps **Claim Now**. Their screen shows a 6-character code, a live clock and a spinning cone, which makes a screenshot easy to spot. To double-check a code, go to **Admin panel → Check a reward code**. Codes expire after 15 minutes and can't be reused.

## Lost spoons
- **Customer handles it:** they buy a new spoon and link it under Profile → My spoon. The old spoon stops working, and their punches carry over.
- **You handle it:** Admin panel → Spoon QR codes → look up the code, then **Unlink**, so the spoon can be linked again, or **Unlink & retire**, so it never works again.

## Weekly voting
Edit **Flavors of the Week** and **Pop-up locations**, then press **Start a new voting week** to reset the tallies. Members who haven't voted get a push reminder on Wednesday afternoons.

## Flash sales
Type a message and press **Start sale**. It appears on everyone's Home screen and sends a push notification to members who have notifications on. Press **End sale** when it's over.

## Member data
The admin home shows sign-ups, rewards members, voters this week and **members by school**. Raw data is in Firebase console → Firestore → `users`.
