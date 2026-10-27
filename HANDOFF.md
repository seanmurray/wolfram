# HANDOFF — Mac: TestFlight build 2 (program v2)

**Written:** 2026-10-27 on the PC. **For:** the Mac (iOS station).
Read `PROJECT.md` first, then this. Specs: `docs/specs/program-v2.md`,
`docs/specs/native-ios.md`.

## State

- Build 1.0 (1) is in Beta App Review with the v1 program. Leave it there.
- **Program v2 is live on the web** (https://seanmurray.github.io/wolfram/):
  STOP-EM phases, the +5% load rule (which also fixes the blank REC column),
  alternating gym days A/B with a landings/carry/core finisher, impact as
  5×10 with 60 s rests at 4 a week, and the bone guide in Settings. None of it
  is on the iPhone until build 2 is uploaded.
- No native code changed: same Capacitor 7.6.7 plugins, same `Info.plist`.
  The timer notification copy changed ("Next set of jumps", fires after 60 s).

## Steps

1. `cd ~/dev/wolfram && git pull --ff-only`
2. `PATH="/usr/local/opt/node@22/bin:$PATH" npm ci`, then `npm run check`
   (79 tests must pass) and `npm run build:native`.
3. `export DEVELOPER_DIR="$HOME/Downloads/Xcode 3.app/Contents/Developer"`;
   `xcodebuild -version` **must** say 26.3.
4. Simulator spot-check (iPhone 16 Pro, iOS 26.3, the runtime that worked for
   build 1): Today → Impact → tick set 1, background the app, and a "Next set
   of jumps" notification arrives after ~60 s. Then Home gym → day A shows
   the finisher (drop landings, carry, core). Record the result in `PROJECT.md`.
5. Archive and upload exactly as for build 1 (`archive`, then `-exportArchive`
   with `ios/App/ExportOptions.plist`). Xcode bumps the build number; don't
   hand-edit it.
6. App Store Connect → Wolfram Strength → TestFlight: wait for build 2 to
   finish processing, then add it to the "Family/Friends" group. Read the
   console for what it asks; if it needs review again, submit it.
7. `PROJECT.md`: dated Done-ledger and Release-log rows, update Status and the
   backlog item. Commit named files only, then push. If `cap sync` rewrote
   `ios/App/CapApp-SPM/Package.swift`, commit that too.

## Don't

- Don't upgrade Capacitor (pinned 7.6.7) or accept any Xcode "update project
  settings" prompt.
- Don't hand-edit `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION`.
- Don't commit anything personal about the user (public repo; see
  `CLAUDE.md` → Hard constraints).
