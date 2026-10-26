# Wolfram — project status

**Last updated:** 2026-10-26 — Capacitor iOS shell ready for a TestFlight build (Mac next); web unchanged and live.

Section headers stay fixed so both machines and every session find things.
Newest entries go at the TOP of each list. Keep the Last-updated line to one
sentence; history lives in Release log / Incidents, not here.

## Status

- Web: **live** at https://seanmurray.github.io/wolfram/. Verify any deploy
  with `npm run check-live` (compares the served build id to local HEAD).
  Feature-complete for v1 per `docs/specs/program-and-classes.md`.
- Android: n/a (personal PWA)
- iOS: **Capacitor 7 shell committed, never built yet.** Next: the Mac builds
  and uploads to TestFlight (`HANDOFF.md`); the user installs from an
  external-tester invite. Spec: `docs/specs/native-ios.md`.

## Done ledger (dated — never redo these)

| Date | Step | Where | Notes |
|---|---|---|---|
| 2026-10-26 | App Store Connect app record created: name **"Wolfram Strength"** ("Wolfram" is taken; the home screen still says Wolfram), Apple ID **6827281356**, SKU `wolfram-ios`, English (U.S.), Full Access | App Store Connect, team 6RWD7M34MY | Sean approved the values. Verified after reload on App Information (bundle select = com.seanmurray.wolfram). A "user access could not be saved" notice appeared; the result is all users, which matches the Full Access choice |
| 2026-10-26 | App ID `com.seanmurray.wolfram` registered (explicit, description "Wolfram", no extra capabilities; In-App Purchase is Apple's default) | developer.apple.com, team 6RWD7M34MY | Verified after reload in Identifiers |
| 2026-10-26 | Capacitor 7 iOS shell (SPM): bundle `com.seanmurray.wolfram`, team `6RWD7M34MY`, iPhone + portrait only, no-encryption flag, mic usage string, icon + launch screen, `ExportOptions.plist` (upload, Xcode-managed build numbers) | local → pushed | Native data file in Documents + restore (newest copy wins), share-sheet export, screen-off timer notifications, SW torn down on native. Web checked in a production preview: SW still registers, fonts bundled, zero third-party requests |
| 2026-10-26 | Class availability: evenings / workday / weekends (alternating, anchored on-device), usual-before-sometimes planning, one-week overrides, open-windows card | local → pushed | Spec criteria 11–13 verified in the dev build; 63 unit tests |
| 2026-10-26 | GitHub repo created (public) + Pages enabled (`build_type=workflow`, before the first push); first push deployed | `seanmurray/wolfram` | Sean approved in chat. Run 40380168936 succeeded; check-live confirmed build c764418 |
| 2026-10-26 | v1 spec built: LIFTMOR-four gym session (learn → heavy at session 7), impact sets with levels, class library + planner, log-a-class, Today tally/suggestion, target sliders, bone-health settings | local | Verified in the dev build at 375×812 against spec criteria 1–10; 52 unit tests |
| 2026-10-26 | Forked from Perennial `8945518` (tracked files only, fresh history) | `C:\dev\personal\wolfram` | Perennial artwork, README, person-specific comments removed |
| 2026-10-26 | Template layer applied | repo | `.gitattributes`, `.editorconfig`, `.githooks` (pre-commit check, pre-push build), `.claude/settings.json`, `check-live.mjs` |

## Backlog (top = next)

1. Mac: simulator pass for spec criteria 2–5, then the first TestFlight upload (`HANDOFF.md`)
2. TestFlight Test Information (beta description, feedback email, review contact, privacy policy URL); waiting on Sean's values
3. TestFlight external group with the user's email (the External Testing section only appears once a build exists); first build through Beta App Review
4. On-device pass on the user's iPhone: TestFlight install, log a class, force-quit, reopen, data intact
5. Final brand artwork — `brand/mark.svg` is a placeholder (lit filament "W"); Sean may supply art, as he did for Perennial
6. Upload a fresh TestFlight build at least every 90 days (builds expire)
7. Resolve the npm `edgesOut` crash (Incidents) before vitest is needed

## Blockers

- None.

## Decisions (with "do not chase")

| Date | Decision | Why | Do NOT reopen unless |
|---|---|---|---|
| 2026-10-26 | No ClassPass integration; class schedule comes from the user's own free windows + a class-type guide | ClassPass's only API is the partner-only Inventory API for venues — nothing reads a member's schedule or bookings (checked developers.classpass.com 2026-10-26) | ClassPass publishes a member-facing API |
| 2026-10-26 | iPhone PWA (Home Screen install), not a native shell | Safari 17+ supports the Storage API and WebKit grants `persist()` heuristically, favouring Home Screen web apps; same quota as the browser (webkit.org/blog/14403, read 2026-10-26). Local-first hardening (IDB mirror, snapshot, export) carried over from Perennial | Data loss observed on the device despite Home Screen install |
| 2026-10-26 | Every storage key, IDB name, and Cache Storage name is `wolfram-`-prefixed | All `seanmurray.github.io/*` project pages share one origin — and with it localStorage, IndexedDB and Cache Storage — with Perennial and soccer-coach | Never |
| 2026-10-26 | Public repo; no personal details in committed files | Both working Pages repos are public; Pages-on-private needs a paid plan, which couldn't be confirmed (`gh api user` → `plan: null`). The person this is for is described by goals only | Repo goes private |
| 2026-10-26 | Studio-warm look: bone canvas, filament-ember accent, graphite ink; Fraunces display + DM Sans body | Sean's pick; tungsten = density, "heavy stone", warm light. All text colours ≥ 4.5:1 on bg and card | Sean asks for a new direction |
| 2026-10-26 | Unit tests on `node:test` + `node:assert`, run by `npm test` with a TZ preload; part of `npm run check` (pre-commit + CI) | No install needed (npm crash above); Dressed already uses it; pure modules use explicit `.js` imports so Node ESM resolves them | A component/DOM test is needed |
| 2026-10-26 | Personal app, GitHub Pages (not Cloudflare Workers) | Sean chose "personal, like Perennial"; Workers default is for commercial work | Promoted to an MML product — then also rename (Wolfram is a Wolfram Research trademark) |

## Incidents (root cause, not symptoms)

| Date | What broke | Root cause | Fix / rule added |
|---|---|---|---|
| 2026-10-26 | History showed "Invalid Date" on every session | `lib/dateFormat.js` came from the soccer app, where `performed_at` was a Postgres DATE ("2026-10-26"); localdb writes ISO timestamps, so the day parsed as NaN. **Also live in Perennial** (same file, same storage) | Formatter handles both shapes, shows timestamps in local time; 4 tests incl. a 10 pm-local/next-day-UTC case |
| 2026-10-26 | `npm install -D vitest@<any>` crashes: `Cannot read properties of null (reading 'edgesOut')` in arborist `#loadPeerSet` (npm 10.9.2). Lockfile and node_modules left untouched | **Open.** Crash is inside npm's peer-set resolution while walking vitest's optional peers (`@vitest/browser-playwright`, `@vitejs/devtools-vitest`). Same with 4.1.12 and 5.0.4, so not version mixing. `npm ci` works, and so do other installs: the Capacitor 7 packages installed cleanly the same day (74 added, 0 changed), so the crash is specific to vitest's peer chain. Two attempts made; stopped per the two-attempt rule. Untried: deleting node_modules only (keep lockfile), `--legacy-peer-deps` (may prune peers), newer npm | Tests use Node's built-in `node:test` instead (no install, works on CI Node 20). **Gotcha found along the way:** a failed `npm i` then `npx vitest` silently fetched vitest@latest into the npx cache. Run tests via `npm test` only |
| 2026-10-26 | A timezone set as `TZ=… node` in Git Bash never reached Node | MSYS strips `TZ` from the environment of native Windows programs | `scripts/tz-preload.mjs` sets `process.env.TZ` at runtime via `--import` (works everywhere). Negative control verified: without it the env check fails |

## Release log

| Date | Version | Build | Target | Status |
|---|---|---|---|---|

## Needs the other machine

- PC → Mac: first TestFlight build: simulator pass for spec criteria 2–5, archive, upload (`HANDOFF.md`).
