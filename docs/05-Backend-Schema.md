# 05 — Backend Schema — Data Model & Storage Architecture

> How data is stored, structured, and secured — defined before the AI writes a single migration.

## Architecture stance: local-first, no server

Statusly has **no backend, no accounts, no cloud**. Every byte of user media and metadata stays on the device. This is deliberate: it's the strongest privacy story, the cheapest to run, removes an entire class of Play policy risk, and there's no reason to sync ephemeral status media to a server. "Schema" here means the **on-device** data model.

Two stores:
1. **`expo-sqlite`** — structured, queryable records (saved-item index, tracked contacts, alert log).
2. **`react-native-mmkv`** — fast key/value for flags, settings, and IAP entitlement.

Actual status/media files live on disk (gallery via MediaLibrary, or app cache); the DB only stores lightweight pointers + metadata.

---

## SQLite tables

### `saved_items`
Index of everything the user saved.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | uuid |
| `type` | TEXT | `'image' \| 'video'` |
| `source` | TEXT | `'whatsapp' \| 'business' \| 'quote'` |
| `local_uri` | TEXT | gallery/asset URI of the saved file |
| `origin_name` | TEXT | original status filename (if known) |
| `size_bytes` | INTEGER | |
| `duration_ms` | INTEGER NULL | videos only |
| `thumb_uri` | TEXT NULL | cached thumbnail |
| `saved_at` | INTEGER | epoch ms |
| `origin_modified_at` | INTEGER NULL | status file's lastModified |

Indexes: `idx_saved_type (type)`, `idx_saved_saved_at (saved_at DESC)`.

### `tracked_contacts`
Contacts the user wants new-status alerts for. Note: WhatsApp does not expose real contact identities via `.Statuses` — files are anonymized. So "contact" here is a derived bucket keyed by whatever grouping signal is available (file cluster / heuristic), plus an optional user-supplied label.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | uuid |
| `label` | TEXT NULL | user-editable name |
| `match_key` | TEXT | heuristic key used to group/match status files |
| `avatar_uri` | TEXT NULL | last seen thumbnail |
| `alerts_enabled` | INTEGER | 0/1 |
| `created_at` | INTEGER | epoch ms |

Index: `idx_tracked_alerts (alerts_enabled)`.

### `seen_status_hashes`
Dedupe + "what's new" detection for the alert job. Rolling window (prune > 7 days).

| Column | Type | Notes |
|--------|------|-------|
| `hash` | TEXT PK | hash of filename+size+mtime |
| `contact_key` | TEXT NULL | FK-ish → tracked_contacts.match_key |
| `first_seen_at` | INTEGER | epoch ms |
| `notified` | INTEGER | 0/1 |

Index: `idx_seen_first_seen (first_seen_at)`.

### `quotes` (bundled, read-mostly)
Shipped with the app (seeded from a JSON asset); user can favorite.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | |
| `category` | TEXT | `'motivation' \| 'love' \| 'life' \| 'funny' \| ...` |
| `text` | TEXT | quote body |
| `bg_style` | TEXT | gradient/style token for rendering |
| `is_favorite` | INTEGER | 0/1 |

Index: `idx_quotes_category (category)`.

## MMKV keys

| Key | Type | Purpose |
|-----|------|---------|
| `folderGrant.whatsapp` | string (treeUri) | persisted SAF grant |
| `folderGrant.business` | string | persisted SAF grant (business) |
| `perm.notifications` | bool | notification permission state |
| `hasRemovedAds` | bool | IAP entitlement (source of truth: Billing, cached here) |
| `alerts.enabled` | bool | master alerts toggle |
| `alerts.intervalMin` | number | background check cadence |
| `onboarding.complete` | bool | |
| `theme` | string | `'system' \| 'light' \| 'dark'` |
| `ads.lastInterstitialAt` | number | frequency cap |
| `stats.savedCount` | number | drives interstitial cadence + rating prompt |

## Data lifecycle & security

- **No auth.** There are no accounts or roles. The only "permission" model is OS-level: the SAF folder grant + media + notification permissions.
- **Media stays on device.** Saved files go to the public gallery (user-owned). App cache holds only transient copies for repost/share and is purged on a schedule.
- **No sensitive fields, no PII collected.** IAP is handled entirely by Google Play Billing; no payment data touches the app or any DB.
- **Ads SDK** is the only component that sends data off-device (AdMob advertising ID). Disclose in the Play Data Safety form and privacy policy.
- **Deletion:** removing a saved item deletes its `saved_items` row and (optionally, with confirmation) the gallery file. Uninstall wipes SQLite + MMKV automatically.

## Migrations

- Version the SQLite schema (`PRAGMA user_version`). Ship migration steps in `src/db/migrations`.
- v1 creates all four tables + indexes and seeds `quotes` from `assets/quotes.json`.
- Keep migrations forward-only and idempotent.

## Why no cloud (trade-off noted)

Adding accounts/cloud backup would enable cross-device saved libraries but introduces auth, storage cost, a privacy-policy liability for hosting user media, and Play review scrutiny — all for a feature users of a 24-hour-status utility rarely ask for. Defer to v2 as an **optional, opt-in** backup only, and even then back up the *index*, not the media, where possible.
