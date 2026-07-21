# 03 — App Flow — Navigation & User Journey Map

> Every page, every click, every path — mapped before a single screen is built.

## Navigation model

Bottom tab bar (4 tabs) + stacked modal/overlay screens on top.

```
Bottom tabs:  [ Status ]  [ Saved ]  [ Quotes ]  [ Settings ]
Stacked:      Onboarding · Viewer (image/video) · Direct Chat · Paywall (Remove Ads)
```

## Screen inventory

| # | Screen | Purpose |
|---|--------|---------|
| S0 | **Splash** | Brand splash while checking permission + IAP state. |
| S1 | **Onboarding / Permission** | Explain value, request notification permission, launch SAF folder grant. |
| S2 | **Status (Home)** | Tabbed STATUS/SAVED-style view; contact-grouped list, IMAGE/VIDEO filter. Entry point once permission is granted. |
| S3 | **Viewer — Image** | Full-screen swipeable image with Save · Share · Repost trio. |
| S4 | **Viewer — Video** | Video player (scrubber, play/pause) with the action trio. |
| S5 | **Saved** | Saved library; IMAGE/VIDEO filter; re-share, delete, multi-select. |
| S6 | **Multi-select mode** | Overlay state on Status/Saved: "Selected Items (n)" with batch Save/Share/Delete. |
| S7 | **Quotes** | Categorized gallery of text/quote status cards; tap to share/repost. |
| S8 | **Direct Chat** | Country code + number field → opens WhatsApp chat without saving. |
| S9 | **Settings** | Alerts toggle, tracked contacts, WhatsApp/Business source, remove ads, restore, privacy, rate. |
| S10 | **Paywall** | "Remove Ads" — price, benefits, buy, restore. |
| S11 | **Alerts settings** | Choose which contacts trigger a new-status notification. |

## First screen

A brand-new user lands on **S0 Splash**, then routes to **S1 Onboarding** because no folder grant exists yet. A returning user with a valid persisted grant skips straight to **S2 Status**.

## Permission / onboarding flow (the critical path)

```
Splash (S0)
  └─ hasFolderGrant? 
       ├─ yes → Status (S2)
       └─ no  → Onboarding (S1)
                 ├─ Slide 1: "Save & repost any status"
                 ├─ Slide 2: "Never miss a new status" → request POST_NOTIFICATIONS
                 └─ Slide 3: "Grant access to statuses"
                        └─ [Grant Access] → SAF ACTION_OPEN_DOCUMENT_TREE (seeded to .Statuses)
                              ├─ granted → persist URI → Status (S2)
                              └─ denied  → stay on S1 with "Access needed" empty state + retry
```
Onboarding is the #1 drop-off point for this category — keep copy short, show a preview image of the folder picker, and make the grant button unmissable.

## Core user journeys

**Journey 1 — Save a status (primary flow)**
```
Status (S2) → tap a contact group → thumbnails
   → tap a thumbnail → Viewer (S3/S4)
      → tap Save → media written to gallery → toast "Saved to gallery"
      → (interstitial ad may show, frequency-capped, if ads on)
```

**Journey 2 — Repost to own status**
```
Viewer (S3/S4) → tap Repost
   → file cached → Android share sheet opens targeted at WhatsApp
   → user picks "My status" → returns to app
```

**Journey 3 — Batch save**
```
Status/Saved → long-press an item → enters Multi-select (S6)
   → tap more items → header shows "Selected Items (n)"
   → tap Save → all saved → toast → exit multi-select
```

**Journey 4 — New status alert**
```
Settings (S9) → Alerts → enable → pick contacts (S11)
   → background job checks .Statuses periodically
   → new file from tracked contact detected → push notification
   → tap notification → deep-links into that contact's statuses (S2 → group)
```

**Journey 5 — Direct chat**
```
Status or Settings → Direct Chat (S8)
   → pick country code + type number → tap Message
   → wa.me deep link opens WhatsApp chat (number not saved)
```

**Journey 6 — Share a quote**
```
Quotes (S7) → pick category → tap a card
   → Share sheet (or Repost to status) → posted
```

**Journey 7 — Remove ads**
```
Any ad "✕"/upsell OR Settings → Paywall (S10)
   → tap Buy → Play Billing → success → ads disappear app-wide
   → "Restore" re-checks entitlement
```

## States (per screen)

| Screen | Empty | Loading | Error |
|--------|-------|---------|-------|
| Status | "No statuses yet — open WhatsApp and view some statuses, then come back." (with refresh) | Skeleton grid | "Can't read statuses — re-grant access" → button to relaunch SAF |
| Saved | "Nothing saved yet." illustration | Skeleton | "Couldn't load saved items" retry |
| Quotes | (bundled, never empty) | Spinner on first load | Cached fallback |
| Direct Chat | Neutral form | — | "Enter a valid number" inline validation; "WhatsApp not installed" if intent fails |
| Viewer | — | Spinner over media | "Couldn't load media" + back |
| Alerts | "No contacts tracked yet." | — | Permission-denied banner if notifications off |

## Redirects & rules

- After a successful SAF grant → **Status (S2)**.
- After IAP success/restore → back to origin screen, ads removed immediately.
- Tapping a status notification → **Status (S2)**, auto-scrolled to that contact.
- If folder grant is later revoked by the OS → next launch detects missing access → route to **S1** "Access needed" state.
- Back from Viewer → returns to the grid scroll position it came from.
- Multi-select: hardware Back exits multi-select before leaving the screen.

## Navigation diagram (text)

```
                ┌───────────── Bottom Tabs ─────────────┐
   Splash ─▶ Onboarding ─grant▶  Status   Saved   Quotes   Settings
                                   │        │                 │
                                   ▼        ▼                 ├─▶ Alerts settings ─▶ pick contacts
                              Viewer(img/vid)  (multi-select) ├─▶ Direct Chat
                                   │                          └─▶ Paywall (Remove Ads)
                              Save/Share/Repost
```
