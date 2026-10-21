# CivilQuant Privacy Notice — Beta / Draft (21 October 2026)

CivilQuant is an engineering calculator. This statement describes the code in the public beta, including optional integrations that are inactive until configured. Before the Play Store release, replace this draft with a reviewed, verified privacy policy and contact address.

## Data handled
- Manual project names and measurement sheet entries are saved locally on your Android device. PDF exports are shared only when you initiate sharing.
- The camera and gallery are used to select a drawing or site photograph. Optional offline OCR extracts visible text on-device. Photos used only for offline OCR are not transmitted to an AI server.
- If you sign in to the optional Supabase service after it is configured, your email address and authentication data are processed for account access.
- If you submit a photo or PDF for cloud AI analysis after activation, the file, your question and any stated scale are transmitted through Supabase Edge Functions to an OpenAI API model for analysis. We configure response storage disabled, but third-party provider policies may permit other retention; do not upload confidential drawings without permission.
- After approved subscription activation, RevenueCat and the app store process purchase/entitlement metadata. CivilQuant does not collect credit card details directly.
- Once live AdMob is activated, Google may process device identifiers, consent signals and ad interaction data according to its privacy notices. Test ad units do not earn revenue.

## Retention and deletion
Manual sheets stay on the device until deleted or the app is removed; PDF exports can remain in folders/apps to which you share them. Configured cloud account deletion is exposed in the Pro tab and implemented by the authenticated delete-account function. Deleting an app account does not cancel a Google Play subscription; cancellation must be done in the store. Contact the developer through the repository Issues if you need assistance.

## International users
Data may be processed by cloud providers in other jurisdictions once remote services are activated. Privacy controls, children's audience designation and regional consent flows must be reviewed before launch.

## Contact
Developer project: https://github.com/zohaibasghar-lgtm/civilquant
