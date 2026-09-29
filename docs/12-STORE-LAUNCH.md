# Phase 12 — Store Launch Runbook (Statusly)

Everything needed to ship `com.statusly.app` to Google Play. Work top to bottom.
Items marked **[YOU]** need your accounts/values; **[DONE]** is already wired in code.

---

## 0. Before anything — fill the placeholders

The app is code-complete but has intentional placeholders. Fill these first:

| Placeholder | Where | What to put |
|---|---|---|
| `[PUBLISH DATE]`, `[YOUR ADDRESS]` | `legal/TERMS-OF-SERVICE.md`, `legal/PRIVACY-POLICY.md` | Real launch date + your postal address (Google requires a developer address) |
| `[PRIVACY POLICY URL]` | both legal docs | The public URL you host the policy at (see §5) |
| Follow-us URL | `app/settings.tsx` (LinkRow "Follow us") | Your real social link |
| Brand name "Statusly" | store listing | Confirm final name (placeholder per CLAUDE.md) |

After editing the `legal/*.md`, re-run `python legal/build-legal-html.py` to regenerate `legal/site/*.html`.

---

## 1. Real ad / billing / crash IDs  **[YOU]**

Create these as **EAS secrets** (auto-injected into cloud builds; never commit them).
`app.config.ts` already reads each from `process.env`, falling back to AdMob **test** IDs in dev.

```bash
eas secret:create --scope project --name ADMOB_ANDROID_APP_ID       --value ca-app-pub-XXXX~YYYY
eas secret:create --scope project --name ADMOB_BANNER_UNIT_ID        --value ca-app-pub-XXXX/BBBB
eas secret:create --scope project --name ADMOB_INTERSTITIAL_UNIT_ID  --value ca-app-pub-XXXX/IIII
eas secret:create --scope project --name IAP_REMOVE_ADS_SKU          --value remove_ads
eas secret:create --scope project --name SENTRY_DSN                  --value https://....ingest.sentry.io/....   # optional
```

- **AdMob**: create the app + ad units at admob.google.com. The `androidAppId` is also injected into the manifest by the `react-native-google-mobile-ads` config plugin (`app.config.ts`) — set `ADMOB_ANDROID_APP_ID` before the production build.
- **Play Billing**: in Play Console → Monetize → In-app products, create a **managed product** with ID `remove_ads` (must match `IAP_REMOVE_ADS_SKU`). Price it once.

## 2. Build & submit  **[YOU runs, config DONE]**

```bash
eas login
eas build -p android --profile production      # produces an .aab (app-bundle)
```

For `eas submit` you need a **Google Play service account JSON** (Play Console → Setup → API access → create service account → grant "Release manager"). Save it as `./google-play-service-account.json` (already gitignored; path is set in `eas.json`).

```bash
eas submit -p android --profile production      # uploads to the internal track as a draft
```

`eas.json` is configured: production = app-bundle, `autoIncrement`, submit → `internal` track, `releaseStatus: draft`.

## 3. Store listing copy

Current listing (Play Console → Grow users → Store presence → Main store listing). Only the **Play Store title** changed — the in-app / launcher name stays `Statusly` (`app.config.ts`).

- **App name (30 chars max):** `Status Saver-Status Downloader` (30 chars — the spaced form `Status saver - Status downloader` is 32 and won't save)
- **Short description (80 chars max):**
  `Status saver & downloader: save photos & videos in HD. Share or repost in 1 tap` (79 chars)
- **Full description:**

```
Statusly is an independent app and is not affiliated with, endorsed by, or sponsored by WhatsApp LLC or Meta Platforms, Inc. WhatsApp is a trademark of WhatsApp LLC.

Statusly is a fast, simple status saver for WhatsApp and WhatsApp Business. Browse the photo and video statuses your contacts post, then save them to your gallery in full HD, share them anywhere, or repost them to your own status in one tap.

★ SAVE STATUS IN HD
Download photo and video statuses in original quality, with no compression and no watermark.

★ SAVE · SHARE · REPOST
Every status has three one-tap actions. Repost any video status or picture to your own status in seconds.

★ BUSINESS STATUS SUPPORT
A dedicated tab for WhatsApp Business statuses.

★ MULTI-SELECT
Batch-save or batch-share many statuses at once.

★ NEW STATUS ALERTS
Get notified when new statuses are available to save.

★ DIRECT CHAT
Message any number without saving it to your contacts.

★ QUOTES GALLERY
Ready-made quote cards to share or post as your status.

★ PRIVATE BY DESIGN
No account, no cloud, no uploads. Your photos and videos never leave your phone. Statusly only reads the status folder you choose to grant access to.

HOW TO USE
1. Open WhatsApp and view a status.
2. Open Statusly. The status appears automatically.
3. Tap Save, Share, or Repost.

Statuses only appear in Statusly after you have viewed them in WhatsApp. Statusly cannot see statuses you have not opened.

Free with ads. Remove ads with a one-time purchase.
```

**Graphics (present in `assets/`):** icon `assets/icon/icon_store_1024.png`, feature graphic `assets/marketing/00_feature_graphic_1024x500.png`, screenshots `assets/marketing/01…06_*.png`.

**Listing rules:** no "WhatsApp" / "WA" in the title; no "Best", "#1", "Free", emojis or ALL CAPS in the title; "for WhatsApp" only descriptively in the long description; keep the non-affiliation disclaimer first (see `legal/PLAY-COMPLIANCE.md` §1).

**ASO notes:**
- Category: Tools (or Video Players & Editors — match where competitors rank).
- Screenshots: add a short caption to each ("Save statuses in HD", "Repost in one tap"); the first 3 matter most.
- Localize the listing for key status-saver markets (Hindi, Portuguese, Arabic, Indonesian, Spanish); review any machine translation.
- Ratings and install velocity outweigh keywords — consider an in-app review prompt after ~3rd save (needs a code change).
- Don't repeat keywords unnaturally — Play flags keyword stuffing as spam.

### Previous listing draft (superseded, kept for reference)

- **App name (30 chars):** `Statusly — Status Saver` (or `Statusly: Status Saver & Repost` if it fits)
- **Short description (80 chars):**
  `Save WhatsApp statuses in HD — photos & videos. Save, share, repost in a tap.`
- **Full description (draft — trim to 4000 chars):**
  > Statusly is the simplest way to keep the WhatsApp statuses you love. Browse the photos and videos your contacts have posted, then **save them to your gallery in full HD**, **share** them anywhere, or **repost** them to your own status in a single tap.
  >
  > • **Save in HD** — original quality, no compression.
  > • **Save · Share · Repost** — every status, one tap each.
  > • **Business statuses too** — a dedicated B Status tab.
  > • **Multi-select** — batch-save or batch-share many at once.
  > • **New-status alerts** — get notified when there's something new to save.
  > • **Direct chat** — message any number without saving the contact.
  > • **Quotes gallery** — a bundled set of shareable quote cards.
  > • **Private by design** — everything stays on your device. No account, no cloud, your media never leaves your phone.
  >
  > Statusly is an independent app and is not affiliated with, endorsed by, or connected to WhatsApp LLC or Meta Platforms, Inc. "WhatsApp" is a trademark of WhatsApp LLC.

## 4. Data Safety form  (must match the Privacy Policy exactly)

| Question | Answer |
|---|---|
| Does the app collect/share user data? | **Yes** (via ads + crash reporting only) |
| Data collected | **Device or other IDs** (advertising ID) — for Advertising/Marketing, collected + shared, not user-editable. **App activity/diagnostics** (crash logs) — for Analytics, collected, not shared. **Approx. location** (IP-derived, by ads) if applicable |
| User media (photos/videos) | **NOT collected** — read on-device only, never uploaded. State this clearly. |
| Contacts, messages, precise location | **NOT collected** |
| Is data encrypted in transit? | **Yes** (ads/crash use HTTPS) |
| Can users request deletion? | No account/server data; users uninstall to remove local data |
| Data collection optional? | Ads removable via IAP; advertising ID resettable in system settings |

**Critical:** the form must agree with `legal/PRIVACY-POLICY.md` §5–§9. A mismatch is the #1 rejection cause.

## 5. Policy hosting  **[YOU]**

Google requires a **publicly reachable Privacy Policy URL**. `legal/site/privacy-policy.html` + `terms-of-service.html` are ready to host — GitHub Pages, Netlify, or any static host. Put the resulting URL into:
- the two `legal/*.md` `[PRIVACY POLICY URL]` slots (then rebuild html),
- the Play Console listing "Privacy Policy" field.

## 6. Content rating & target audience

- **Content rating (IARC questionnaire):** utility app, no violence/sexual/gambling content → expect **Everyone / PEGI 3**. Note: user-generated media is displayed (statuses) — answer the "user-generated content" questions honestly.
- **Target audience:** **13+** (matches Privacy Policy §11). Do **not** target children.
- **Ads declaration:** **Yes, contains ads.**
- **Permissions:** be ready to justify SAF folder access (core function). **MANAGE_EXTERNAL_STORAGE is NOT requested** — this is the compliant design; do not add it.

## 7. Pre-launch checklist

- [ ] Placeholders filled (§0); legal html rebuilt + hosted (§5)
- [ ] EAS secrets created with real IDs (§1); `remove_ads` product live in Play
- [ ] `eas build -p android --profile production` succeeds
- [ ] Install the .aab on a device (or internal track) and smoke-test the **global done criteria**: grant → browse → save (verify in gallery) → repost/share → multi-select batch → new-status alert → direct chat → share a quote → **buy Remove Ads (ads disappear) → Restore purchase**
- [ ] Data Safety + content rating + target audience submitted and consistent with policy
- [ ] Release to **internal testing** → **closed test** → **production** (staged rollout %)

## 8. Post-launch

- Watch Sentry (crash-free ≥ 99.5%) and Play "Android vitals".
- Monitor ratings; wire the in-app "Rate the app" deep link.
- Turn AdMob from test → real only in the production build (dev keeps test IDs automatically).

---

### Still-open engineering follow-ups (not launch-blocking)
- On-device verify of the last rebuild's **tab-swipe** + **batch multi-share** (built, not yet finger-tested).
- Manual test matrix across Android 8 / 11 / 13 / 14 (SAF behavior differs) — Phase 11 item that needs those devices.
