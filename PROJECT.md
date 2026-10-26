# Wolfram — project status

**Last updated:** 2026-10-26 — program + classes spec built and verified locally; not pushed (no GitHub repo yet).

Section headers stay fixed so both machines and every session find things.
Newest entries go at the TOP of each list. Keep the Last-updated line to one
sentence; history lives in Release log / Incidents, not here.

## Status

- Web: **not deployed.** Planned at https://seanmurray.github.io/wolfram/ once
  the repo exists (see Blockers). The app is feature-complete for v1 per
  `docs/specs/program-and-classes.md` and verified in the local dev build.
- Android: n/a (personal PWA)
- iOS: n/a — installed to the iPhone Home Screen as a PWA (see Decisions)

## Done ledger (dated — never redo these)

| Date | Step | Where | Notes |
|---|---|---|---|
| 2026-10-26 | v1 spec built: LIFTMOR-four gym session (learn → heavy at session 7), impact sets with levels, class library + planner, log-a-class, Today tally/suggestion, target sliders, bone-health settings | local | Verified in the dev build at 375×812 against spec criteria 1–10; 52 unit tests |
| 2026-10-26 | Forked from Perennial `8945518` (tracked files only, fresh history) | `C:\dev\personal\wolfram` | Perennial artwork, README, person-specific comments removed |
| 2026-10-26 | Template layer applied | repo | `.gitattributes`, `.editorconfig`, `.githooks` (pre-commit check, pre-push build), `.claude/settings.json`, `check-live.mjs` |

When the repo is created: enable Pages with `build_type=workflow` *before* the
first push, so the first workflow run can't fail on it (Perennial's did).

## Backlog (top = next)

1. Create the GitHub repo + Pages (Blockers), push, verify with `npm run check-live`
2. On-device pass on the user's iPhone: Home Screen install, log a class, force-quit, reopen, data intact (can't be done from Windows)
3. Final brand artwork — `brand/mark.svg` is a placeholder (lit filament "W"); Sean may supply art, as he did for Perennial
4. Install-to-Home-Screen prompt for iOS Safari (persistence depends on it)
5. Resolve the npm `edgesOut` crash (Incidents) before the next devDependency is needed

## Blockers

- **Public GitHub repo + Pages** — auto mode blocked `gh repo create --public` pending Sean's explicit OK (2026-10-26). Everything is committed locally, nothing pushed.

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
| 2026-10-26 | `npm install -D vitest@<any>` crashes: `Cannot read properties of null (reading 'edgesOut')` in arborist `#loadPeerSet` (npm 10.9.2). Lockfile and node_modules left untouched | **Open.** Crash is inside npm's peer-set resolution while walking vitest's optional peers (`@vitest/browser-playwright`, `@vitejs/devtools-vitest`). Same with 4.1.12 and 5.0.4, so not version mixing. `npm ci` works. Two attempts made; stopped per the two-attempt rule. Untried: deleting node_modules only (keep lockfile), `--legacy-peer-deps` (may prune peers), newer npm | Tests use Node's built-in `node:test` instead (no install, works on CI Node 20). **Gotcha found along the way:** a failed `npm i` then `npx vitest` silently fetched vitest@latest into the npx cache. Run tests via `npm test` only |
| 2026-10-26 | A timezone set as `TZ=… node` in Git Bash never reached Node | MSYS strips `TZ` from the environment of native Windows programs | `scripts/tz-preload.mjs` sets `process.env.TZ` at runtime via `--import` (works everywhere). Negative control verified: without it the env check fails |

## Release log

| Date | Version | Build | Target | Status |
|---|---|---|---|---|

## Needs the other machine

- None — web only.
