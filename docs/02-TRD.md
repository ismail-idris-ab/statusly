# 02 — TRD — Technical Requirements Document

> The blueprint the AI agent needs to make technical decisions without guessing.

## Stack summary

| Layer | Choice |
|-------|--------|
| **Framework** | React Native via **Expo (dev build / prebuild)** — *not* Expo Go |
| **Language** | TypeScript (strict) |
| **Navigation** | `expo-router` (file-based) |
| **Styling** | NativeWind (Tailwind for RN) — utility-first |
| **State** | Zustand (lightweight global) + React Query only if remote data is added later |
| **Local storage** | `react-native-mmkv` (settings/flags) + `expo-sqlite` (saved-items index) |
| **Status folder access** | Storage Access Framework via a small native module (see below) |
| **Media save** | `expo-media-library` (write to gallery) |
| **Video** | `expo-video` (playback) |
| **Notifications** | `expo-notifications` + `expo-task-manager` / `expo-background-task` |
| **Ads** | `react-native-google-mobile-ads` (AdMob) |
| **IAP** | `react-native-iap` (Google Play Billing) |
| **Sharing** | `expo-sharing` + native `Intent` for WhatsApp repost |
| **Icons** | `lucide-react-native` |
| **Build/CI** | EAS Build + EAS Submit |
| **Error tracking** | Sentry (`@sentry/react-native`) |

> **Architectural trade-off flagged:** a status saver *cannot* be built in Expo Go. Reading WhatsApp's status directory on Android 11+ requires the Storage Access Framework, which needs custom native code. You must use an **Expo dev build (prebuild/config plugin)** or bare workflow. Everything else (media library, notifications, ads, IAP) is standard. Staying on Expo dev build (rather than fully ejecting to bare) keeps EAS, OTA config, and the managed upgrade path — recommended.

---

## The hard part: reading WhatsApp statuses on modern Android

This drives the whole architecture. Handle it explicitly.

**Where statuses live:**
- Modern WhatsApp (scoped): `Android/media/com.whatsapp/WhatsApp/Media/.Statuses`
- WhatsApp Business: `Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses`
- Legacy (Android ≤ 10): `WhatsApp/Media/.Statuses`

**Access strategy by API level:**

| Android | Strategy |
|---------|----------|
| ≤ 10 (API ≤ 29) | Legacy `READ_EXTERNAL_STORAGE` + direct path read (with `requestLegacyExternalStorage`). |
| 11+ (API ≥ 30) | **Storage Access Framework.** Launch `ACTION_OPEN_DOCUMENT_TREE` pre-seeded to the `.Statuses` folder. Persist the granted URI (`takePersistableUriPermission`). Read entries via `DocumentFile` / `DocumentsContract`. |

**Do NOT** request `MANAGE_EXTERNAL_STORAGE` ("All files access") — Google Play restricts it and will likely reject a status saver for it. SAF is the compliant path.

**Native module contract** (`StatusAccessModule`, exposed to JS):
```ts
interface StatusAccessModule {
  // Launches SAF tree picker seeded to the .Statuses folder. Persists grant.
  requestStatusFolderAccess(source: 'whatsapp' | 'business'): Promise<{ granted: boolean; treeUri: string }>;
  hasAccess(source: 'whatsapp' | 'business'): Promise<boolean>;
  // Lists status files (name, uri, mime, size, lastModified). Newest first.
  listStatuses(source: 'whatsapp' | 'business'): Promise<StatusFile[]>;
  // Copies a status file's bytes into app cache; returns a readable file:// path.
  cacheStatus(uri: string): Promise<string>;
}

type StatusFile = {
  uri: string;          // content:// document uri
  name: string;
  mime: string;         // image/jpeg | video/mp4 | ...
  sizeBytes: number;
  lastModified: number; // epoch ms
  type: 'image' | 'video';
};
```
Implement as a **local Expo config plugin + native module** (Kotlin) so it stays in the managed prebuild flow. Alternatively wrap an existing community package, but a thin custom module keeps the contract clean.

---

## Permissions (AndroidManifest)

- `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` (API 33+, for gallery save/read).
- `READ_EXTERNAL_STORAGE` (maxSdkVersion 32, legacy read).
- `POST_NOTIFICATIONS` (API 33+, for status alerts).
- `RECEIVE_BOOT_COMPLETED` (re-arm background alert job).
- `com.android.vending.BILLING` (IAP).
- `INTERNET`, `ACCESS_NETWORK_STATE` (ads only).
- **No** `MANAGE_EXTERNAL_STORAGE`.

## Repost / share to WhatsApp

Reposting = sharing a cached media `file://` (via `FileProvider` content URI) with an `ACTION_SEND` intent targeted at `com.whatsapp`, letting the user pick "My status" as the destination. There is no public API to post directly to a user's status silently — the OS share sheet is the only compliant route. UX: "Repost" copies the file and opens WhatsApp's share target; the user taps "Add to status."

- Generic **Share** → `ACTION_SEND` with a chooser (Telegram, TikTok, etc.).
- **Direct Chat** → `https://wa.me/<number>` deep link (or `intent://send?phone=`), which opens a chat without saving the contact.

## Ads (AdMob)

- **Banner** on the Saved and Quotes tabs (bottom, above nav).
- **Interstitial** after N save actions (frequency-capped, e.g. 1 per 3 min) and on some back-navigations.
- **App Open** ad on cold start (capped).
- **Native ad** optionally interleaved into the status grid every ~12 items.
- All ads gated behind `hasRemovedAds` flag → hidden when the IAP is owned.
- Use test ad unit IDs in dev; real IDs from env at build time.

## IAP

- Single non-consumable product: `remove_ads` (Google Play Billing).
- On purchase/restore, set `hasRemovedAds` in MMKV + verify entitlement on each launch via `getAvailablePurchases()`.
- Provide a "Restore purchases" button in Settings.

## Environment variables (EAS secrets / `.env`)

```
ADMOB_ANDROID_APP_ID=
ADMOB_BANNER_UNIT_ID=
ADMOB_INTERSTITIAL_UNIT_ID=
ADMOB_APPOPEN_UNIT_ID=
ADMOB_NATIVE_UNIT_ID=
IAP_REMOVE_ADS_SKU=remove_ads
SENTRY_DSN=
```
No secret is required for status reading — it's fully local.

## Folder structure

```
statusly/
├── app/                      # expo-router routes
│   ├── (tabs)/
│   │   ├── index.tsx         # Status (home)
│   │   ├── saved.tsx         # Saved library
│   │   ├── quotes.tsx        # Quotes gallery
│   │   └── settings.tsx      # Settings
│   ├── viewer/[id].tsx       # Full-screen image/video viewer
│   ├── direct-chat.tsx       # Direct chat
│   ├── onboarding.tsx        # Permission onboarding
│   └── _layout.tsx
├── src/
│   ├── components/           # StatusGrid, StatusCard, ActionTrio, ...
│   ├── features/
│   │   ├── status/           # listing, grouping, viewer logic
│   │   ├── saved/
│   │   ├── quotes/
│   │   ├── alerts/           # background job + notifications
│   │   ├── ads/              # ad wrappers + gating
│   │   └── iap/
│   ├── native/               # JS bindings for StatusAccessModule
│   ├── store/                # zustand stores
│   ├── db/                   # expo-sqlite schema + queries
│   ├── lib/                  # share intents, wa.me, formatting
│   └── theme/                # tokens, tailwind config
├── modules/status-access/    # local native module (Kotlin) + config plugin
├── assets/                   # icon, splash, images
├── app.config.ts
└── eas.json
```

## Naming conventions

- Components `PascalCase.tsx`; hooks `useThing.ts`; utils `camelCase.ts`.
- Feature-first grouping under `src/features`.
- No `any`; model native payloads with explicit types. Zod-validate the native module's returned arrays at the boundary.

## Hard constraints

- Must run on Android 8 (API 26) through the latest; SAF path required from API 30.
- No user media ever leaves the device. Privacy policy must state this.
- No `MANAGE_EXTERNAL_STORAGE`. SAF only.
- Ads and analytics are the only network calls; everything else works offline.
- Ship with Play Data Safety form completed (no data collected/shared beyond ads SDK).
