# CLAUDE.md — Statusly

Project memory for Claude Code. Read this before doing anything. The full specs live in `./docs` (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan) — those six documents are the **single source of truth**. This file is the quick-reference + the rules you must not break.

## What we're building

**Statusly** — an Android WhatsApp status saver. Browse statuses your contacts posted, save photos/videos to the gallery in HD, and Save · Share · Repost any of them. Plus: new-status alerts, direct chat (message a number without saving it), multi-select batch save/share, and a quotes gallery. Free, ad-supported (AdMob) with a one-time "Remove Ads" IAP.

Store title (SEO): **"Statusly — Status Saver & Repost"**. `Statusly` is a placeholder brand name — confirm before hardcoding it in the store listing.

## Non-negotiable constraints (breaking these fails the project)

1. **Expo dev build, NOT Expo Go.** Reading WhatsApp's `.Statuses` folder needs native code. Use `expo prebuild` + a config plugin. Never assume Expo Go.
2. **Storage Access Framework (SAF) only.** Access statuses via `ACTION_OPEN_DOCUMENT_TREE` seeded to the `.Statuses` folder + `takePersistableUriPermission`. **Never** request `MANAGE_EXTERNAL_STORAGE` ("All files access") — Google Play rejects status savers for it.
3. **No backend, no accounts, no cloud.** Everything is on-device (SQLite + MMKV + gallery). No user media ever leaves the device. The only network calls are the ads SDK + Sentry.
4. **TypeScript strict, no `any`.** Validate the native module's returned data with Zod at the JS boundary.
5. **Phase discipline.** Build in the order in `docs/06-Implementation-Plan.md`. Do not start a phase until the previous phase's "Done" criteria are met. Phase 3 (native status access) gates all status-listing UI — build it before any screen that lists statuses.

## Stack

- **Expo (dev build) + React Native + TypeScript (strict)**
- **expo-router** (file-based navigation)
- **NativeWind** (Tailwind for RN) — utility-first, avoid custom stylesheets
- **Zustand** (global state) · **react-native-mmkv** (settings/flags) · **expo-sqlite** (saved-items index)
- **expo-media-library** (save to gallery) · **expo-video** (playback) · **expo-notifications** + **expo-background-task** (alerts)
- **react-native-google-mobile-ads** (AdMob) · **react-native-iap** (Play Billing)
- **lucide-react-native** (icons) · **@sentry/react-native** (crash reporting)
- **EAS Build / Submit** · package id `com.statusly.app`

## Project structure

```
app/                      # expo-router routes
  (tabs)/                 # index(Status) · saved · quotes · settings
  viewer/[id].tsx         # full-screen image/video viewer
  direct-chat.tsx · onboarding.tsx · _layout.tsx
src/
  components/             # StatusGrid, StatusCard, ActionTrio, Fab, ...
  features/               # status · saved · quotes · alerts · ads · iap
  native/                 # JS bindings + Zod schemas for StatusAccessModule
  store/                  # zustand stores
  db/                     # expo-sqlite schema, migrations, queries
  lib/                    # share intents, wa.me, formatting
  theme/                  # tokens + tailwind config
modules/status-access/    # local native module (Kotlin) + config plugin
assets/                   # icon, splash, mockups, samples (already generated)
app.config.ts · eas.json
```

## Native module contract (`StatusAccessModule`)

```ts
interface StatusAccessModule {
  requestStatusFolderAccess(source: 'whatsapp' | 'business'): Promise<{ granted: boolean; treeUri: string }>;
  hasAccess(source: 'whatsapp' | 'business'): Promise<boolean>;
  listStatuses(source: 'whatsapp' | 'business'): Promise<StatusFile[]>; // newest first
  cacheStatus(uri: string): Promise<string>; // returns readable file:// path
}
type StatusFile = { uri: string; name: string; mime: string; sizeBytes: number; lastModified: number; type: 'image' | 'video' };
```

Status folder paths (keep configurable):
- WhatsApp: `Android/media/com.whatsapp/WhatsApp/Media/.Statuses`
- Business: `Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses`
- Legacy (API ≤ 29): `WhatsApp/Media/.Statuses`

**Repost** = cache the file → expose via `FileProvider` content URI → `ACTION_SEND` intent targeted at `com.whatsapp`; user picks "My status". There is no silent "post to status" API — the share sheet is the only compliant route.
**Direct chat** = `https://wa.me/<number>` deep link.

## Design tokens (see `docs/04-UIUX-Brief.md` for the full system)

```
primary #0E8F6E · primary-dark #0A6E55 · primary-light #14B88C
accent #25D07A · accent-glow #3DE38B
bg #FFFFFF · surface #F4F7F5 · surface-alt #E9F2EC
text #0F1A16 · text-muted #5B6B64 · border #DDE6E1 · danger #E5484D
dark: bg #0B1411 · surface #13201B · text #EAF3EE
```
Font: Inter. Radius: cards/buttons 12px, chips pill, FAB full circle. Flat + hairline borders (no heavy shadows) except the FAB and bottom sheets. Signature element: oversized emerald→mint gradient action button with a soft glow. Light mode primary, full dark-mode parity via system setting.

## Coding conventions

- Components `PascalCase.tsx`; hooks `useThing.ts`; utils `camelCase.ts`; feature-first under `src/features`.
- Functional components + hooks only. No class components.
- Style with NativeWind utility classes; pull colors from theme tokens, never hardcode hex in components.
- Handle every state: empty / loading / error (specs in `docs/03-App-Flow.md`). No silent failures.
- Ads and IAP: everything ad-related is gated on the `hasRemovedAds` flag. Use AdMob **test** unit IDs in dev; real IDs from env at build time.
- No secrets in the repo. Env vars via EAS secrets / `.env` (see TRD list). `.env` is gitignored.
- Accessibility: 48dp min tap targets, TalkBack labels on icon-only buttons, respect dynamic font scaling + reduced motion.

## Commands (fill in real ones as they stabilize)

```bash
# install
npm install
# prebuild native projects (required — this is a dev build)
npx expo prebuild -p android
# run on device
npx expo run:android
# lint / typecheck
npm run lint && npm run typecheck
# eas
eas build -p android --profile preview
eas submit -p android
```

## Working agreement

- Follow the phase plan; announce which phase/step you're on.
- If a decision isn't covered by the six docs, **ask before choosing** — don't freelance architecture.
- Prefer complete, working files over fragments. Type everything. No placeholder TODO stubs unless I ask for a sketch.
- Flag any meaningful architecture/product trade-off briefly before committing to it.
- After each phase, run through its "Done" criteria and confirm they're met before moving on.
