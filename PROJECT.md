# Wolfram — project status

**Last updated:** 2026-10-28 — TestFlight 1.0 (2) with program v2 is live to the external tester (Testing).

Section headers stay fixed so both machines and every session find things.
Newest entries go at the TOP of each list. Keep the Last-updated line to one
sentence; history lives in Release log / Incidents, not here.

## Status

- Web: **live** at https://seanmurray.github.io/wolfram/. Verify any deploy
  with `npm run check-live` (compares the served build id to local HEAD).
  Program v2 per `docs/specs/program-v2.md` (supersedes v1's program
  content in `program-and-classes.md`).
- Android: n/a (personal PWA)
- iOS: **TestFlight 1.0 (2) (program v2) Testing** in external group
  "Family/Friends" (the user is the one tester), alongside 1.0 (1) (v1).
  Next: the on-device pass on the user's iPhone. Spec:
  `docs/specs/native-ios.md`.

## Done ledger (dated — never redo these)

| Date | Step | Where | Notes |
|---|---|---|---|
| 2026-10-28 | 1.0 (2) added to "Family/Friends" and submitted for Beta App Review (What to Test: program-update notes; auto-notify on) | App Store Connect | Approved at once: status Testing after reload (no full review for a later build) |
| 2026-10-28 | TestFlight 1.0 (2) uploaded (program v2; Xcode 26.3; Xcode bumped the build number to 2) | Mac → App Store Connect | `npm run check` clean, 80 tests. Processed to Ready to Submit (internal group gets it automatically). Same ITMS-90068 deployment-target warning |
| 2026-10-28 | Simulator spot-check for build 2 (iPhone 16 Pro / iOS 26.3) | Mac simulator | Impact: set 1 ticked → bridge checkPermissions granted → schedule id 4207; app backgrounded; SpringBoard added/saved the notification with shouldPresentAlert YES ~60 s later. Home gym day A shows the finisher: drop landings 3×10, farmer's carry 3×20 s, dead bug 1×10/side |
| 2026-10-28 | Beta App Review approved 1.0 (1): status Testing in Family/Friends | App Store Connect | Seen on the TestFlight builds page |
| 2026-10-27 | Program v2 built: STOP-EM phases in gym weeks (foundation → building → lighter → 8-week strength blocks), +5% load rule, alternating day A/B with drop landings + carry + core, impact as 5×10 with 60 s rests and a 4/week default (max 7), low-bone-density spine and landing rules, bone guide with linked sources (SWAN, USPSTF 2025, STOP-EM, Menopause Society 2022, UK consensus, LIFTMOR, creatine RCT); settings store v2 migration (bench, impact 3 → 4) | local → pushed | Sean approved items 1–9. Sources re-read 2026-10-27. 79 unit tests. Dev build at 375×812: migration, REC 62.5 lb after a 60 lb session, A → B → A, finisher logs Impact, 3 of 5 impact sets counts, low-bone-density swaps landings and shows the class note, bone guide renders; no console errors |
| 2026-10-26 | TestFlight groups: internal "Murray Movement Labs" (created first: the External Testing section only appeared after an internal group existed), external "Family/Friends" with the user invited by email; build 1.0 (1) added and **submitted for Beta App Review** (sign-in required: unchecked; What to Test filled; auto-notify on) | App Store Connect | Verified after reload: group shows 1 tester, 1 build, status Waiting for Review |
| 2026-10-26 | First TestFlight upload: 1.0 (1), archive + `-exportArchive` with `ExportOptions.plist` (Xcode 26.3 via DEVELOPER_DIR) | Mac → App Store Connect | App record confirmed first in the console ("Wolfram Strength", bundle select = com.seanmurray.wolfram). Upload took ~2 s, no CDUploads stall. Build processed to Ready to Submit in TestFlight → iOS Builds. Apple warning: deployment target iOS 14.0; from April 2027 uploads need 15.0+ (backlog) |
| 2026-10-26 | Simulator pass, spec criteria 2–5 (Xcode 26.3, **iPhone 16 Pro / iOS 26.3**: the only runtime installed; the iOS 18.0 runtime in `HANDOFF.md` is unavailable under 26.3) | Mac simulator | (2) indirect: no ServiceWorkers store in the app's WebKit data, CacheStorage holds only its salt (no Web Inspector session). (3) onboarding + class "Barbell Strength" logged heavy → `Documents/wolfram-data.json` held the session + `wolfram-settings`/`wolfram-classes`; app terminated, LocalStorage + IndexedDB dirs deleted, relaunch showed Heavy 1/2 and the class. (4) share sheet showed `wolfram-backup-2026-10-26` (JSON, 2 KB). (5) **failed first** (see Incidents), passed after the fix: bridge logged checkPermissions → requestPermissions → granted → schedule id 4207; app backgrounded; SpringBoard logged the notification added with shouldPresentAlert 1 at end of the 30 s. Side note: iOS logged `Failed to find sound "default"` (the plugin treats `sound` as a file name) |
| 2026-10-26 | TestFlight Test Information saved: beta description, feedback email, Beta App Review contact, review notes (no sign-in), privacy policy URL `https://seanmurray.github.io/wolfram/privacy.html` | App Store Connect → Wolfram Strength → TestFlight → Test Information | Sean approved all values; contact details live only in ASC (public repo). Verified after reload |
| 2026-10-26 | Privacy page published (`public/privacy.html`): nothing collected, data stays on device, local notifications, mic only for the recorded timer sound, GitHub Pages hosting | GitHub Pages | No personal details on the page |
| 2026-10-26 | App Store Connect app record created: name **"Wolfram Strength"** ("Wolfram" is taken; the home screen still says Wolfram), Apple ID **6827281356**, SKU `wolfram-ios`, English (U.S.), Full Access | App Store Connect, team 6RWD7M34MY | Sean approved the values. Verified after reload on App Information (bundle select = com.seanmurray.wolfram). A "user access could not be saved" notice appeared; the result is all users, which matches the Full Access choice |
| 2026-10-26 | App ID `com.seanmurray.wolfram` registered (explicit, description "Wolfram", no extra capabilities; In-App Purchase is Apple's default) | developer.apple.com, team 6RWD7M34MY | Verified after reload in Identifiers |
| 2026-10-26 | Capacitor 7 iOS shell (SPM): bundle `com.seanmurray.wolfram`, team `6RWD7M34MY`, iPhone + portrait only, no-encryption flag, mic usage string, icon + launch screen, `ExportOptions.plist` (upload, Xcode-managed build numbers) | local → pushed | Native data file in Documents + restore (newest copy wins), share-sheet export, screen-off timer notifications, SW torn down on native. Web checked in a production preview: SW still registers, fonts bundled, zero third-party requests |
| 2026-10-26 | Class availability: evenings / workday / weekends (alternating, anchored on-device), usual-before-sometimes planning, one-week overrides, open-windows card | local → pushed | Spec criteria 11–13 verified in the dev build; 63 unit tests |
| 2026-10-26 | GitHub repo created (public) + Pages enabled (`build_type=workflow`, before the first push); first push deployed | `seanmurray/wolfram` | Sean approved in chat. Run 40380168936 succeeded; check-live confirmed build c764418 |
| 2026-10-26 | v1 spec built: LIFTMOR-four gym session (learn → heavy at session 7), impact sets with levels, class library + planner, log-a-class, Today tally/suggestion, target sliders, bone-health settings | local | Verified in the dev build at 375×812 against spec criteria 1–10; 52 unit tests |
| 2026-10-26 | Forked from Perennial `8945518` (tracked files only, fresh history) | `C:\dev\personal\wolfram` | Perennial artwork, README, person-specific comments removed |
| 2026-10-26 | Template layer applied | repo | `.gitattributes`, `.editorconfig`, `.githooks` (pre-commit check, pre-push build), `.claude/settings.json`, `check-live.mjs` |

## Backlog (top = next)

1. On-device pass on the user's iPhone: TestFlight install, log a class, force-quit, reopen, data intact
2. Final brand artwork — `brand/mark.svg` is a placeholder (lit filament "W"); Sean may supply art, as he did for Perennial
3. Upload a fresh TestFlight build at least every 90 days (builds expire; 1.0 (2) uploaded 2026-10-28 → by 2027-01-26)
4. Raise the iOS deployment target 14.0 → 15.0 before April 2027 (ITMS-90068 on build 1; uploads below 15.0 are refused from then)
5. Notification sound: plugin treats `sound: 'default'` as a file name (iOS logs "Failed to find sound"); check on the device whether the alert sounds
6. Resolve the npm `edgesOut` crash (Incidents) before vitest is needed

## Blockers

- None.

## Decisions (with "do not chase")

| Date | Decision | Why | Do NOT reopen unless |
|---|---|---|---|
| 2026-10-27 | Program phases count **gym weeks** (weeks with a home-gym session), not calendar weeks or sessions | STOP-EM's phases are calendar months at 2 sessions/week; the user is at the gym ~once a week. Calendar weeks would advance the ramp without practice; sessions would treat two in a week as two weeks | The user trains at the gym 2+ times a week regularly |
| 2026-10-27 | No 1RM testing, no maxes on file; loads anchor on logged sets | Unsupervised home gym; STOP-EM's test week dropped | Never |
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
| 2026-10-27 | The REC column never showed a weight, even with history | Perennial scaffold: `SetTable` passed `calcRec: 0` (no %1RM math here) and `seedBaseRec` returns early when `calcRec <= 0`, so last session's top set was never used. **Same bug in Perennial** | `lib/progression.js` `startingLoad` anchors on the last non-lighter session's top set (STOP-EM rule, scheme conversion, layoff); sets now store their prescription. Dead `rx.js` removed. Perennial fixed separately |
| 2026-10-26 | Native timer notifications never scheduled: no permission prompt, no bridge calls | `getPlugin()` resolved a promise with the Capacitor plugin proxy. The proxy answers every property, `then` included, so the promise called `LocalNotifications.then()`, which rejected as unimplemented; `.catch(() => null)` swallowed it, so everything was a silent no-op | `timerNotification.js` caches the module and reads `.LocalNotifications` after the await. Rule: never return or resolve a Capacitor plugin proxy from a promise or async function |
| 2026-10-26 | History showed "Invalid Date" on every session | `lib/dateFormat.js` came from the soccer app, where `performed_at` was a Postgres DATE ("2026-10-26"); localdb writes ISO timestamps, so the day parsed as NaN. **Also live in Perennial** (same file, same storage) | Formatter handles both shapes, shows timestamps in local time; 4 tests incl. a 10 pm-local/next-day-UTC case |
| 2026-10-26 | `npm install -D vitest@<any>` crashes: `Cannot read properties of null (reading 'edgesOut')` in arborist `#loadPeerSet` (npm 10.9.2). Lockfile and node_modules left untouched | **Open.** Crash is inside npm's peer-set resolution while walking vitest's optional peers (`@vitest/browser-playwright`, `@vitejs/devtools-vitest`). Same with 4.1.12 and 5.0.4, so not version mixing. `npm ci` works, and so do other installs: the Capacitor 7 packages installed cleanly the same day (74 added, 0 changed), so the crash is specific to vitest's peer chain. Two attempts made; stopped per the two-attempt rule. Untried: deleting node_modules only (keep lockfile), `--legacy-peer-deps` (may prune peers), newer npm | Tests use Node's built-in `node:test` instead (no install, works on CI Node 20). **Gotcha found along the way:** a failed `npm i` then `npx vitest` silently fetched vitest@latest into the npx cache. Run tests via `npm test` only |
| 2026-10-26 | A timezone set as `TZ=… node` in Git Bash never reached Node | MSYS strips `TZ` from the environment of native Windows programs | `scripts/tz-preload.mjs` sets `process.env.TZ` at runtime via `--import` (works everywhere). Negative control verified: without it the env check fails |

## Release log

| Date | Version | Build | Target | Status |
|---|---|---|---|---|
| 2026-10-28 | 1.0 | 2 | TestFlight (iOS) | Program v2. Processed; submitted to Family/Friends → Testing the same day |
| 2026-10-26 | 1.0 | 1 | TestFlight (iOS) | Processed (no Missing Compliance); Beta App Review approved 2026-10-28 → Testing; expires in 90 days. ITMS-90068 warning email (deployment target 14.0) |

## Needs the other machine

- None. (iPhone: install 1.0 (2) from TestFlight.)
