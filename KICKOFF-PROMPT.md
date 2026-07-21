# Claude Code kickoff prompt

Copy everything in the block below and paste it as your first message to Claude Code, run from the `Statusly/` directory (with `CLAUDE.md` and `docs/` present).

---

```
You are building Statusly, an Android WhatsApp status-saver app. Read CLAUDE.md and all six documents in ./docs (01-PRD, 02-TRD, 03-App-Flow, 04-UIUX-Brief, 05-Backend-Schema, 06-Implementation-Plan). Treat those six docs + CLAUDE.md as the single source of truth for every decision.

Before writing code, confirm you've read them by giving me a 6-8 line summary: what we're building, the stack, and the three constraints you consider most likely to trip us up.

Then start Phase 1 (Project setup) from docs/06-Implementation-Plan.md. Rules for the whole project:

1. Work phase by phase, in order. Do NOT start a phase until the previous phase's "Done" criteria are met. At the end of each phase, list the Done criteria and confirm each is satisfied, then stop and wait for my go-ahead before the next phase.
2. Hard constraints you must never break: Expo dev build (NOT Expo Go); Storage Access Framework only (never MANAGE_EXTERNAL_STORAGE); no backend/accounts/cloud, media never leaves the device; TypeScript strict with no `any`; Zod-validate data at the native boundary.
3. Phase 3 (native status-access module) gates all status-listing UI — build and verify it before any screen that lists statuses.
4. Production quality: complete, typed files; handle empty/loading/error states; no placeholder TODO stubs unless I ask for a sketch.
5. If any decision isn't covered by the docs, ASK me before choosing — don't invent architecture. Flag meaningful trade-offs briefly before committing.
6. Use the design tokens and native module contract exactly as specified in CLAUDE.md / the docs. Ad code is always gated on the hasRemovedAds flag; use AdMob test IDs in dev.

Start now with the summary, then Phase 1. Keep me in the loop at each phase boundary.
```

---

## How to use it

1. Scaffold or open the project folder, then start Claude Code inside `Statusly/`.
2. Paste the block above as your first message.
3. Answer its Phase-1 questions (package name, whether to keep the `Statusly` name, real AdMob IDs — you can defer these with placeholders).
4. At each phase boundary it will pause; review, then tell it to continue.

## Optional follow-up prompts

- **Jump to a phase:** `Skip to Phase 5 (browse + save + repost). Assume Phases 1–4 are done; scaffold any missing pieces first.`
- **Native module focus:** `Focus only on modules/status-access. Implement the full StatusAccessModule contract from CLAUDE.md in Kotlin with an Expo config plugin, plus the JS bindings + Zod schemas in src/native.`
- **Design pass:** `Implement the UI for the Status screen to match assets/mockups/01_status_home.png and the tokens in docs/04-UIUX-Brief.md.`
