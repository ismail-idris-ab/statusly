# 01 — PRD — Product Requirements Document

> The north star. Everything else flows from this.

| Field | Value |
|-------|-------|
| **App Name** | Statusly *(working name — see naming note below)* |
| **Tagline** | Save, repost, and share any WhatsApp status — in one tap. |
| **Platform** | Android only (v1) |
| **Category** | Tools / Utility |
| **Monetization** | Free, ad-supported (AdMob) + one-time "Remove Ads" IAP |

**Naming note:** "Statusly" is a placeholder brand. For Play Store SEO, ship the store listing title as a brand + keyword combo, e.g. **"Statusly — Status Saver & Repost"**. Every top competitor puts the keyword *Status Saver* in the title; do the same.

---

## Problem

WhatsApp statuses disappear after 24 hours and there is no built-in way to keep a photo or video you like. Users currently screen-record, screenshot (losing quality), or ask the sender to forward the file. It's clumsy, low-quality, and you often miss the status before it expires.

**Who feels it:** anyone active on WhatsApp who wants to keep, re-share, or repost media friends post as status — a huge, global, low-friction audience (competitor apps in this space have 200k–400k+ reviews).

## Core value proposition

One tap to save any status in original HD quality, repost it straight back to your own status, or forward it anywhere — plus alerts so you never miss a new status, and a direct-chat tool to message any number without saving it. It bundles the best feature from each of the leading status savers into one clean app.

## Target user

Everyday WhatsApp users (skewing mobile-first, emerging-market heavy) who consume a lot of status content and want to keep or reshare it. They are not technical; they want a fast, obvious, no-friction utility. A secondary persona is the "sharer" who reposts motivational quotes, memes, and clips to their own status daily and wants a quick pipeline to do it.

## Competitive synthesis (why this app wins)

Distilled from 20+ competitor store screenshots. Each competitor does one or two things well; v1 combines the best of all:

| Feature | Seen in competitors | Statusly's take |
|---------|--------------------|-----------------|
| Save photo/video status | All | Core. HD, original quality, one tap. |
| Save · Share · Repost trio | Most | Present on every item + in the full-screen viewer. |
| STATUS / SAVED tabs + IMAGE/VIDEO filter | Most | Clean segmented tabs, contact-grouped status list. |
| Contact-grouped view ("Thomas · 4 Statuses") | Several | Group statuses by contact, not a flat dump. |
| New Status Alerts (notification) | Several | Background check + push when a contact posts. |
| Direct Chat (message without saving number) | 2 | Included — a genuine differentiator. |
| Multi-select batch save/share | 1–2 | Select many, save/share at once. |
| Share to Telegram/TikTok/Snapchat/etc. | Most | Native Android share sheet + quick-share row. |
| Built-in quotes/status gallery | Some | Library of text/quote statuses to post. |
| Home-screen widget | A few | v2 (nice-to-have). |

## Features

### Must Have (v1)
- **Browse statuses** — read WhatsApp's status media, grouped by contact, split into Images and Videos.
- **HD save to gallery** — save any status to the device gallery in original quality.
- **Save · Share · Repost** — per item and in the full-screen viewer. Repost re-shares media directly to the user's own WhatsApp status.
- **Full-screen viewer** — swipeable image viewer and a video player with scrubber, play/pause, and the action trio.
- **Saved library** — everything the user saved, with Images / Videos filter, re-share, and delete.
- **Multi-select batch** — long-press to select multiple items; save or share them at once ("Selected Items (n)").
- **New status alerts** — opt-in background job that notifies the user when a tracked contact posts a new status.
- **Direct chat** — enter any phone number and open a WhatsApp chat with it without saving it as a contact.
- **Quotes/status gallery** — a bundled, categorized library of text/quote status cards to share or repost.
- **First-run permission onboarding** — guided flow to grant the folder/media access WhatsApp status reading needs.
- **Remove-ads IAP** — one-time purchase to remove all ads.

### Nice to Have (v2+)
- Home-screen widget (quick access to latest statuses).
- WhatsApp Business status support (separate folder).
- Story maker / editor for quotes (custom backgrounds, fonts).
- Cloud backup of saved items.
- Themes (dark mode toggle beyond system default, accent colors).
- In-app image cropping/trimming before repost.

### Out of Scope (v1)
- iOS (WhatsApp's iOS sandbox makes status folder access infeasible).
- User accounts / login / social features.
- Saving statuses from platforms other than WhatsApp (Instagram, Facebook) — v3 consideration.
- Any server-side storage of user media. All media stays on-device.
- Bypassing WhatsApp DRM or scraping private content the OS doesn't already expose.

## User stories

- As a user, I want to see the statuses my contacts posted so that I can pick ones to keep.
- As a user, I want to save a status photo or video in full quality so that I still have it after it expires.
- As a user, I want to repost a saved status to my own status so that I can share it with my contacts.
- As a user, I want to select several statuses at once so that I can save them without tapping each one.
- As a user, I want a notification when a specific contact posts a new status so that I don't miss it.
- As a user, I want to message a number without saving it so that I can do a one-off chat.
- As a user, I want a library of quotes so that I can post a status without making one from scratch.
- As a user, I want to remove ads with a single purchase so that the app feels clean.

## Success metrics

- **Activation:** ≥ 70% of new installs successfully grant permissions and reach the status list (permission grant is the #1 drop-off for this app category).
- **Core action:** ≥ 50% of activated users save at least one status in session 1.
- **Retention:** D7 retention ≥ 25%.
- **Repost adoption:** ≥ 15% of savers use repost or share within the first week.
- **Monetization:** remove-ads IAP conversion ≥ 1.5% of monthly actives; stable eCPM on banner + interstitial.
- **Quality:** crash-free sessions ≥ 99.5%; Play Store rating ≥ 4.4.

## Key risks

- **Permission model:** Android 11+ scoped storage restricts direct access to `Android/media/com.whatsapp/...`. Must use the Storage Access Framework (SAF) `ACTION_OPEN_DOCUMENT_TREE` grant. This is the single biggest technical + UX risk — see TRD.
- **Play Store policy:** apps that read another app's media and request broad storage can be rejected. Mitigate by using SAF (no `MANAGE_EXTERNAL_STORAGE`), clear disclosure, and a privacy policy stating no media leaves the device.
- **WhatsApp changes:** folder paths can change across WhatsApp versions; keep them configurable.
