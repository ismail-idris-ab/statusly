# 04 — UI/UX Design Brief — Visual & Interaction Design Guide

> So the AI doesn't just build something functional — it builds something you'd actually use.

## Aesthetic

Clean, friendly, high-contrast Android-native utility. Familiar "messaging green" language so users instantly trust it as a status tool, but with a slightly deeper, more premium emerald than WhatsApp so it reads as its own brand, not a clone. Material 3 spacing, rounded cards, big circular action buttons, generous tap targets. Light mode primary; dark mode supported via system.

Reference feel: WhatsApp's information density + Google Photos' grid + Telegram's snappy interactions.

## Color palette

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#0E8F6E` | Brand emerald — app bars, primary buttons, active tab, icon |
| `primary-dark` | `#0A6E55` | Pressed states, gradients bottom |
| `primary-light` | `#14B88C` | Gradient top, highlights |
| `accent` | `#25D07A` | Save/Repost circular FAB, success |
| `accent-glow` | `#3DE38B` | The big floating repost/download button glow |
| `bg` | `#FFFFFF` | Screen background (light) |
| `surface` | `#F4F7F5` | Cards, tab bar background |
| `surface-alt` | `#E9F2EC` | Selected chips, subtle fills |
| `text` | `#0F1A16` | Primary text |
| `text-muted` | `#5B6B64` | Secondary text, timestamps |
| `border` | `#DDE6E1` | Hairlines, dividers |
| `danger` | `#E5484D` | Delete, errors |
| `on-primary` | `#FFFFFF` | Text/icons on emerald |
| **Dark mode** | | |
| `bg-dark` | `#0B1411` | Screen background |
| `surface-dark` | `#13201B` | Cards |
| `text-dark` | `#EAF3EE` | Primary text |

**Signature element:** a large circular emerald→mint gradient **action button** (download/repost) with a soft outer glow — the visual hook every competitor uses. Keep it, own it.

## Typography

- **Font:** Inter (UI). System fallback: Roboto.
- **Scale:** Display 28/700 · H1 22/700 · H2 18/600 · Body 15/400 · Caption 13/400 · Button 15/600.
- Marketing/store graphics use a heavier weight (800) for the big "Save & Repost" headlines.

## Components & patterns

- **Segmented tabs** (STATUS / SAVED, IMAGE / VIDEO) — pill underline indicator, emerald active.
- **Contact status row** — circular avatar with an emerald ring when unseen, name, "· N statuses", timestamp, quick download icon on the right.
- **Status grid** — 3-col image grid; videos show a play badge + duration chip; rounded 12px corners; 2px gap.
- **Action trio** — three circular emerald buttons (Save / Share / Repost) with labels beneath; appears in viewer and on cards.
- **Floating action button** — oversized (72px) emerald gradient circle with glow for the primary save/repost.
- **Multi-select** — checkable overlay, top bar turns into "Selected Items (n)" with batch actions; count chip in emerald.
- **Cards** — 12–16px radius, `surface` fill, subtle 1px `border`, no heavy shadows (flat + hairline).
- **Bottom sheet** for share targets (quick-share row: WhatsApp, Telegram, TikTok, Snapchat, Instagram, More).
- **Snackbar/toast** for "Saved to gallery", "Reposted", errors.
- **Empty states** — friendly line illustration + one-line copy + single primary action.

## Spacing & shape

- 4px base grid; screen padding 16px; card padding 12–16px.
- Border radius: buttons/cards 12px, chips 999px (pill), FAB full circle.
- Elevation: flat with hairline borders; only the FAB and bottom sheet cast a soft shadow.

## Motion

- Tab switch: 150ms crossfade + indicator slide.
- Save action: FAB press scale 0.94 → 1, checkmark morph, toast slide-up.
- Viewer open: shared-element zoom from grid thumbnail.
- Multi-select enter: checkboxes fade/scale in over 120ms.
- Keep everything ≤ 200ms; this is a utility, not a showcase.

## Dark mode

Full parity via system setting. Emerald stays the accent; backgrounds go near-black green (`#0B1411`), surfaces `#13201B`, text `#EAF3EE`. Test contrast ≥ 4.5:1 for body text in both modes.

## Accessibility

- Minimum tap target 48×48dp.
- Text scales with system font size (no fixed heights that clip).
- Color is never the only signal (unseen ring also pairs with a "NEW" badge).
- Content descriptions on all icon-only buttons for TalkBack.
- Respect reduced-motion.

## Iconography

Lucide set. Key icons: `download`, `share-2`, `repeat`/`corner-up-left` (repost), `bell`, `message-circle`, `check-circle`, `image`, `video`, `trash-2`, `sparkles` (quotes).

## Store creative direction (for the generated marketing assets)

Emerald gradient background, huge white 800-weight headline top ("Save & Repost", "New Status Alerts", "Direct Chat", "Save HD Quality"), a floating white/mint circular action button, and a phone mockup showing the real UI. This mirrors the category's winning ad format while staying on Statusly's slightly-deeper-green brand.
