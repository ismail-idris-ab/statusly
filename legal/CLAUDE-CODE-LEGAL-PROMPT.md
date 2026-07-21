# Claude Code prompt — legal & compliance implementation

Paste the block below into Claude Code when you're ready to wire the legal documents and compliance requirements into the app. Best run **after Phase 4 (onboarding)** and **before Phase 9 (ads/IAP)**, since the consent flow gates ad initialisation.

---

```
Read legal/PRIVACY-POLICY.md, legal/TERMS-OF-SERVICE.md, and legal/PLAY-COMPLIANCE.md.
PLAY-COMPLIANCE.md is the authority for anything policy-related — follow it exactly.

Implement the following. Do not skip the manifest verification steps; they are the
difference between approval and rejection.

1. PERMISSION MINIMISATION (highest priority — this affects architecture)
   - Implement gallery saving with a native MediaStore.insert() call, NOT
     expo-media-library's permission-gated path. On Android 10+ writing to
     MediaStore requires no permission.
   - Build the Saved library by reading back only content URIs the app itself
     created and recorded in saved_items. An app can always read its own
     MediaStore entries without permission.
   - Goal: ZERO READ_MEDIA_IMAGES and ZERO READ_MEDIA_VIDEO in the final merged
     manifest. If a dependency injects them, remove them with tools:node="remove".
   - Never add MANAGE_EXTERNAL_STORAGE or READ_CONTACTS.
   - After implementing, run `npx expo prebuild -p android`, then grep the MERGED
     manifest at android/app/build/intermediates/merged_manifests/ and show me
     every uses-permission line so I can verify.

2. PROMINENT DISCLOSURE (required before the SAF request)
   - On onboarding slide 3, show the disclosure text from PLAY-COMPLIANCE.md Part 1.4
     BEFORE launching ACTION_OPEN_DOCUMENT_TREE.
   - It must be dismissible without granting ("Not now"), and must state that files
     are read on-device only and never uploaded.

3. EEA/UK/SWITZERLAND CONSENT (required before serving ads there)
   - Integrate the UMP consent flow via react-native-google-mobile-ads' AdsConsent API.
   - Request consent info on launch; show the form only where required.
   - Pass consent signals to AdMob BEFORE initialising ads — ads must not initialise
     until consent is resolved.
   - Add a "Privacy options" row in Settings that reopens the form, shown only when
     UMP reports privacy options are required.

4. IN-APP LEGAL LINKS
   - Settings screen: rows for "Privacy Policy" and "Terms of Service" opening the
     hosted URLs in a Custom Tab (I'll supply the URLs — use constants in
     src/lib/constants.ts with clearly named placeholders for now).
   - An "About" screen containing the non-affiliation disclaimer verbatim from
     PLAY-COMPLIANCE.md Part 1.1.
   - Onboarding slide 1: a short line — "By continuing you agree to our Terms and
     Privacy Policy" — with both words tappable.

5. SENTRY PRIVACY
   - Configure Sentry with sendDefaultPii: false and scrub file paths/filenames from
     breadcrumbs and events, so status filenames never reach crash reports.

6. AD GATING
   - Every ad surface must check hasRemovedAds and render nothing when true.
   - Use AdMob TEST unit IDs in dev; real IDs from env only in production builds.

When done, produce a short report: the full list of permissions in the merged
manifest, confirmation that consent gates ad init, and anything in the privacy
policy that no longer matches what the code actually does. If you find a mismatch,
tell me — do not silently change the code or the policy to paper over it.
```

---

## Follow-up prompts

**Host the policies:**
```
Run legal/build-legal-html.py to generate legal/site/. Then set up a public
GitHub Pages repo for those files and give me the resulting URLs. Fix any
unfilled [BRACKETED] placeholders it reports first — ask me for the values.
```

**Final pre-submission audit:**
```
Audit the finished build against the checklist in legal/PLAY-COMPLIANCE.md Part 5.
Go item by item and mark each PASS / FAIL / NEEDS-MANUAL-CHECK with evidence
(file + line, or the manifest line). Be strict — a false PASS here costs a
rejection. List every FAIL with the specific fix.
```

**Verify no media leaves the device:**
```
Prove that no user media is transmitted. Search the codebase for every network
call and every place a file URI or file body could be attached to a request.
Report what each network call sends. Flag anything that could carry user media,
filenames, or folder paths.
```

---

## What you still have to do yourself

These can't be automated:

1. **Fill the placeholders** — postal address (required for Google's developer verification), publish date, hosted URLs, and optionally a dedicated privacy email instead of your personal Gmail.
2. **Get a lawyer to review both documents.** They're carefully researched and tailored to your architecture, but I'm not a lawyer and these are binding legal documents.
3. **Complete the Play Console declarations** using Part 2 of the compliance guide — Data Safety, advertising ID, target audience (13+), content rating.
4. **Re-verify the privacy policy against the finished build** before submitting. If the code changed, the policy must change with it. A mismatch between your policy, your Data Safety form, and actual behaviour is the most common removal trigger for this category.
