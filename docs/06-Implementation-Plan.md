# 06 — Implementation Plan — Step-by-Step Build Sequence

> The exact order to build so the AI never skips a foundation layer. Structured for an agentic (Claude Code) workflow — each phase has a goal, tasks, and a "done" bar. Build phases in order; the native storage layer (Phase 3) gates everything, so don't skip ahead.

---

## Phase 1 — Project setup
**Goal:** a running Expo dev build with tooling, theme, and navigation shells.

- `npx create-expo-app statusly` with TypeScript template; enable strict mode.
- Add `expo-router`, NativeWind (+ tailwind config with the palette from Doc 04), Zustand, `react-native-mmkv`, `expo-sqlite`, `lucide-react-native`, Sentry.
- Configure `app.config.ts` (package `com.statusly.app`, Android permissions from TRD, adaptive icon, splash).
- Set up folder structure from TRD; add ESLint + Prettier + `tsconfig` paths.
- Create the theme tokens + a `ThemeProvider`, and stub the 4 tab screens + stacked routes.
- Wire EAS (`eas.json`: dev, preview, production profiles); produce a first dev build on device.

**Done:** app launches on a physical Android device via dev build, tabs navigate, theme tokens applied, MMKV read/write works.

## Phase 2 — Local database
**Goal:** SQLite + MMKV data layer ready before any feature uses it.

- Implement `src/db` with `PRAGMA user_version` migrations; create `saved_items`, `tracked_contacts`, `seen_status_hashes`, `quotes` (schema in Doc 05).
- Seed `quotes` from `assets/quotes.json`.
- Typed query helpers (`insertSavedItem`, `listSavedItems`, `deleteSavedItem`, etc.), Zod-validated at the boundary.
- MMKV wrapper with typed getters/setters for every key in Doc 05.

**Done:** unit-tested CRUD for all tables; quotes seed on first launch; migrations idempotent.

## Phase 3 — Status access (native, the critical layer)
**Goal:** reliably read WhatsApp statuses across Android versions. **This is the make-or-break phase — do it before any UI that lists statuses.**

- Build the local native module `modules/status-access` (Kotlin) + Expo config plugin implementing the `StatusAccessModule` contract from Doc 02.
- Implement SAF flow: `requestStatusFolderAccess` (seed picker to `.Statuses`, `takePersistableUriPermission`), `hasAccess`, `listStatuses` (via `DocumentFile`/`DocumentsContract`, newest-first, typed as image/video), `cacheStatus` (copy bytes → cache `file://`).
- Legacy path for API ≤ 29.
- JS bindings in `src/native` with Zod validation of returned arrays.
- Persist the granted tree URI in MMKV; detect revoked grants on launch.

**Done:** on a device with WhatsApp statuses viewed, `listStatuses()` returns correct image + video entries; grant survives app restart; revoked-grant is detected and re-requestable.

## Phase 4 — Onboarding & permissions
**Goal:** get a new user from install to a populated status list.

- Splash → route based on `hasFolderGrant` (Doc 03).
- 3-slide onboarding; request `POST_NOTIFICATIONS`; launch SAF grant; handle granted/denied states with retry.
- "Access needed" empty state that relaunches the SAF picker.

**Done:** cold-start new user can grant access and land on a populated Status screen; returning user skips onboarding.

## Phase 5 — Core feature: browse + save + repost
**Goal:** the headline value. (MVP bundle: Core save + repost.)

- **Status (Home):** contact-grouped list + STATUS grid, IMAGE/VIDEO filter, unseen ring/NEW badge, pull-to-refresh, empty/loading/error states.
- **Viewer:** swipeable image viewer + video player (`expo-video`, scrubber/play-pause).
- **Action trio:** Save (→ `expo-media-library`, HD, toast), Share (`ACTION_SEND` chooser), Repost (cache file → FileProvider content URI → share intent targeted at WhatsApp).
- Record every save in `saved_items`; bump `stats.savedCount`.

**Done:** user can browse, open, save (verified in gallery), share, and repost an image and a video end-to-end.

## Phase 6 — Saved library + multi-select
**Goal:** manage saved media and batch actions. (MVP bundle: Multi-select batch.)

- **Saved screen:** grid from `saved_items`, IMAGE/VIDEO filter, re-share, delete (with optional gallery-file removal).
- **Multi-select:** long-press to enter; "Selected Items (n)" header; batch Save/Share/Delete; hardware-back exits mode first.

**Done:** multi-select save/share/delete works on both Status and Saved; counts and toasts correct.

## Phase 7 — New status alerts
**Goal:** re-engagement via notifications. (MVP bundle: New status alerts.)

- **Alerts settings** + **contact picker** (S11) writing to `tracked_contacts`.
- Background task (`expo-background-task`/`expo-task-manager`) that lists statuses, hashes them into `seen_status_hashes`, and fires `expo-notifications` for new files from tracked buckets. Frequency + battery aware; re-arm on `RECEIVE_BOOT_COMPLETED`.
- Notification tap deep-links into that contact's statuses.

**Done:** a newly-viewed status from a tracked bucket produces exactly one notification; tapping it opens the right group; no duplicates.

## Phase 8 — Direct chat + quotes
**Goal:** the two differentiator utilities. (MVP bundle: Direct chat + quotes.)

- **Direct Chat (S8):** country-code picker + number field → `wa.me` deep link; validation; "WhatsApp not installed" handling.
- **Quotes (S7):** categorized gallery rendered from `quotes` (with `bg_style`), favorite toggle, share/repost a rendered card image.

**Done:** direct chat opens WhatsApp without saving the number; quote cards render and share as images.

## Phase 9 — Ads + IAP
**Goal:** monetization, cleanly gated. (Model: free + ads + remove-ads IAP.)

- Integrate `react-native-google-mobile-ads`: banner (Saved/Quotes), frequency-capped interstitial (after N saves / some back-nav), app-open (capped), optional native-in-grid. All gated on `hasRemovedAds`.
- Integrate `react-native-iap`: non-consumable `remove_ads`; **Paywall (S10)**; purchase + restore; verify entitlement on launch; flip `hasRemovedAds`.

**Done:** ads show for free users only, respect caps; buying Remove Ads hides all ads immediately and persists; restore works on reinstall.

## Phase 10 — UI polish & states
**Goal:** production feel.

- Every screen: empty/loading/error states from Doc 03; skeletons; the signature gradient FAB + glow; motion per Doc 04.
- Dark mode parity + contrast check; TalkBack labels; 48dp targets; dynamic font scaling.
- Rating prompt after `stats.savedCount` threshold.

**Done:** all states implemented, dark mode verified, a11y pass done.

## Phase 11 — Testing & hardening
**Goal:** ship-quality.

- Manual test matrix across Android 8 / 11 / 13 / 14 (SAF differs).
- Edge cases: no WhatsApp installed, permission revoked mid-session, empty `.Statuses`, huge videos, low storage, offline (ads fail gracefully).
- Sentry wired; crash-free ≥ 99.5%.
- Verify Play Data Safety form matches actual data flows; privacy policy live.

**Done:** test matrix green; no P0/P1 bugs; policy artifacts ready.

## Phase 12 — Store launch
**Goal:** live on Google Play.

- Finalize store listing (title with keyword, description, the generated feature graphics + screenshots, icon).
- Complete Data Safety, content rating, target-audience declarations.
- EAS Submit an internal-testing build → closed test → production rollout (staged %).
- Set up AdMob real ad units + Billing product in Play Console; smoke-test in production track.

**Done:** app approved and live; ads + IAP verified in production; crash + rating monitoring in place.

---

## Global done criteria
All MVP flows work end-to-end on a physical device: grant access → browse → save (HD, in gallery) → repost/share → multi-select batch → get a new-status alert → direct chat → share a quote → remove ads. Crash-free ≥ 99.5%, rating-ready, Play-policy compliant (SAF only, media never leaves device).

## Suggested agent kickoff prompt
> "Here are my 6 project documents (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan). Use them as the single source of truth. Start Phase 1 and do not advance to the next phase until the current phase's 'Done' criteria are met. Ask me before making any architectural choice not covered by these docs."
