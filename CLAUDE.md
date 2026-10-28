# Wolfram — project rules

A strength-for-the-long-run training PWA: heavy lifting and impact work for
bone density, fitted around the studio classes the user already loves.
Vite + React 19, TanStack Query, Zustand, vite-plugin-pwa; local-first, no
backend. Owner: personal. Repo: `https://github.com/seanmurray/wolfram`
(public). Live: `https://seanmurray.github.io/wolfram/`.
**`PROJECT.md` is the status source of truth — read it first, keep it current.**
Global rules in `~/.claude/CLAUDE.md` apply; this file only adds what is
specific to this app. Keep it under 200 lines; history goes in `PROJECT.md`.

## Commands

- Dev: `npm run dev` (launch config `wolfram-dev`) · Check: `npm run check` (lint + `node:test`)
- Production preview: launch config `wolfram-preview` (port 5191); use it to check service-worker behaviour
- iOS: `npm run build:native` (vite build → `cap sync ios` → `scripts/fix-spm-paths.mjs`). Xcode, signing and upload happen on the Mac; see `HANDOFF.md`
- Build: `npm run build` · Icons: `npm run gen-icons` (from `brand/mark.svg`)
- Deploy: push to `main` → GitHub Actions → Pages. Then `npm run check-live`
  (exit 0 = the pushed sha is what's being served). Pushes queue for anywhere
  from ~45 s to several minutes — wait; never re-dispatch to "rescue" a run.

## Hard constraints

- **Public repo: no personal details in anything committed** — no name next
  to health, gender, or body information. Describe goals, not the person.
- **Every storage key, IDB database, and Cache Storage name starts `wolfram-`.**
  All `seanmurray.github.io/*` apps share one origin (Perennial, soccer-coach).
- Local-first: nothing leaves the device. Backups are user-initiated exports.
- Not medical advice: the app prompts for a DEXA baseline / doctor
  conversation rather than playing clinician.
- Program content is evidence-led (high-load resistance + impact for bone);
  cues are plain language — no Sanskrit, no yoga-flavoured pandering.

## Architecture (pointers, not a tour — Claude can read the code)

- Entry: `src/main.jsx` (boot-time storage recovery runs before render)
- Data: `src/lib/localdb.js` (transactional localStorage + snapshot + IDB mirror)
- Program: `src/data/program.js`, `src/data/exercises.js`; slot resolution in
  `src/lib/resolveSlot.js` (equipment-aware variant chains). Phases (gym
  weeks), A/B days and starting loads: `src/lib/progression.js`. Every claim
  in the app's copy traces to a source in `docs/specs/program-v2.md`; don't
  add a number or standard without one
- Look: `src/styles/tokens.css` (palette + type), `brand/mark.svg` (placeholder)
- Backend: none

## Verification specifics

- Web: `preview_start` name `wolfram-dev`, then the browser tool at 375×812.
- iOS persistence only reproduces on a real iPhone Home Screen install —
  can't be verified from Windows; say so rather than "should work".

## Gotchas already hit (one line each; move detail to PROJECT.md → Incidents)

- 2026-10-26 — Bebas Neue → Fraunces: caps strings and 0.04–0.08em tracking were tuned for an all-caps condensed face; titles are sentence case now.
- 2026-10-28 — The page scrolls under the iOS status bar (viewport-fit=cover); `AppHeader`'s fixed `--sat` strip covers it. Anything new fixed to the top must sit below `--sat`.
- 2026-10-26 — Never put text containing backticks inside a double-quoted bash string (`node -e "…"`): bash runs each backticked span as a command (it emptied PROJECT.md's inline code and tried to execute a spec file). Edit files with the Edit/Write tools.
- 2026-10-26 — `cap sync` on Windows writes backslash paths into `ios/App/CapApp-SPM/Package.swift`; `build:native` runs `scripts/fix-spm-paths.mjs` after every sync.
- 2026-10-26 — Zustand stores hydrate from localStorage at import time, before boot recovery. After a restore, `main.jsx` must `persist.rehydrate()` them, or they keep defaults and overwrite the restore.
- 2026-10-27 — Set 1's REC was always blank: the Perennial scaffold seeded it from a calculated max (`calcLoad()` returned 0) and bailed on 0. Starting loads now come from `lib/progression.js` and anchor on what was actually lifted.
- 2026-10-26 — Git Bash `grep` strips carriage returns, so it reports CRLF files as clean (and multi-line perl/sed edits silently miss). Check line endings with `git ls-files --eol`, never grep.
