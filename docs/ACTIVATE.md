# CivilQuant v1.1 — activation and safety checklist

The mobile app is a real Android build. This repository contains integration code for:
- Supabase Auth and secured AI calls, with 3 lifetime free analyses/account and 20 analyses/pro 30-day window.
- RevenueCat subscriptions (target Pakistan price PKR 750/month; actual store prices controlled by Google/Apple).
- AdMob SDK with Google TEST ads until a real AdMob app ID, ad-unit ID and account approval are provided.

## Critical distinction
**Configured source is not a live service.** A functional paid product requires real provider accounts, secrets and approval. Do not publish or charge users until these integrations have been verified by end-to-end tests.

## Supabase
1. Create a Supabase project. Run the SQL migration in \`supabase/migrations/\` from its SQL editor. Review its access grants and policies.
2. Set Edge Function secrets \`OPENAI_API_KEY\`, \`REVENUECAT_WEBHOOK_SECRET\` using Supabase secret management. The \`SUPABASE_URL\`, project anon key and server service-role key are provided by Supabase for server functions. **Never place the service role key or OpenAI secret in mobile assets or GitHub.**
3. Deploy \`analyze-drawing\` with JWT verification ON and \`revenuecat-webhook\` with JWT verification OFF (the webhook verifies its own secret).
4. Provide non-secret mobile build variables \`EXPO_PUBLIC_SUPABASE_URL\` and \`EXPO_PUBLIC_SUPABASE_ANON_KEY\` to GitHub Actions via repository Variables, then rebuild APK.
5. Test email signup/login, verified email confirmation, quota increments, duplicate requests, 4th-attempt denial, and refund on errors.

## RevenueCat / Google Play Billing
1. Open a Google Play developer account, verify ownership, create the CivilQuant application \`com.civilquant.engineering\`, set payment/payout profile.
2. Create the monthly subscription at desired Pakistani price and localized prices; note pricing/taxes vary by territory. Link it to a RevenueCat offering/package and **entitlement ID \`civilquant_pro\`**.
3. Add RevenueCat Android public SDK key to GitHub **Variables** as \`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY\`, then rebuild.
4. Link the RevenueCat webhook endpoint \`https://YOUR-PROJECT.supabase.co/functions/v1/revenuecat-webhook\` and configure the exact \`REVENUECAT_WEBHOOK_SECRET\` Authorization token in the RevenueCat console and Supabase function secrets. The RevenueCat appUserID must be the Supabase UUID.
5. Confirm payment events, cancellations, expiry, account transfer, refunds, duplicate webhooks and pro entitlement on backend before enabling live charges. NEVER trust the mobile entitlement alone for protected AI usage.
6. Production AAB needs permanent release keystore / Play App Signing. The test APK signing key is ephemeral and **not appropriate for updates or Play Store uploads**.

## AdMob
1. Register and verify AdMob, register the mobile app, set app-ads.txt as instructed by AdMob, and wait for ad serving approval.
2. Change native AdMob app ID using \`ADMOB_ANDROID_APP_ID\` build env var. Set \`EXPO_PUBLIC_ADMOB_BANNER_ID\` and \`EXPO_PUBLIC_REAL_ADS=true\` only after review and consent UI verification; then perform a clean native rebuild. Never run real ads with sample ad IDs.
3. Enable the required European User Messaging Platform consent messages and regional privacy disclosures and confirm ads are suppressed until consent rules permit.
4. Test ad rendering with Google test IDs only. Never click your own live ads.

## AI engineering limits
Images and PDFs can be sent to OpenAI when the service is provisioned, but quantities are not trustworthy without verified dimensions. This is not a substitute for design review, issued-for-construction drawings, specifications or site measurements.
Review PDF size and total token costs; cap page count at gateway before monetized usage.

## Regulatory / launch
- Create data safety disclosures, privacy notice, account deletion pathway, support contact, terms and a verified store listing.
- New Google Play personal accounts may need 12 opted-in testers for 14 continuous days; Play Console may charge a one-time registration fee.
- Subscription purchases cannot be proven with a sideloaded APK without a configured store and test track.
- Advertising earnings, approval and distribution cannot be guaranteed.

## Build
\`npm install && CI=1 npx expo install --fix && npx expo prebuild -p android --clean --no-install && cd android && ./gradlew assembleRelease\`
The GitHub Action automates a *sideloaded test build* with an ephemeral signing key.
