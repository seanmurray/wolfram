# HANDOFF — Mac: first TestFlight build of Wolfram

**Written:** 2026-10-26 on the PC. **For:** the Mac (iOS station).
Read `PROJECT.md` first, then this. Spec: `docs/specs/native-ios.md`.

## State

- The Capacitor 7 iOS shell is committed: `ios/` (Swift Package Manager),
  bundle `com.seanmurray.wolfram`, team `6RWD7M34MY` (Murray Movement Labs
  LLC, the same team soccer-coach and Pounz sign with), automatic signing,
  iPhone only, portrait only, `ITSAppUsesNonExemptEncryption=false`,
  microphone usage string (for the record-your-own-timer-sound feature).
- Web build is live and unchanged at https://seanmurray.github.io/wolfram/.
- Native-only code (no-op on web): data file in Documents
  (`src/lib/nativeFile.js`), share-sheet export, screen-off timer
  notifications (`src/lib/timerNotification.js`), service worker torn down.
- **Not done:** any Xcode build, simulator run, or upload. Nothing here has
  run on iOS yet.
- **App Store Connect is ready:** App ID `com.seanmurray.wolfram` is
  registered and the app record exists as **"Wolfram Strength"** (Apple ID
  6827281356; "Wolfram" was taken). The home-screen name is still "Wolfram"
  (`CFBundleDisplayName`), so don't change it.

## Steps

1. Get the code:
   `cd ~/dev && git clone https://github.com/seanmurray/wolfram.git && cd wolfram`
   (or `git pull --ff-only` if it's already cloned).
2. `PATH="/usr/local/opt/node@22/bin:$PATH" npm ci` (Node 22, as for Pounz).
3. `npm run build:native` (vite build, `cap sync ios`, path fix).
4. Pin Xcode 26.3 for every command in this session:
   `export DEVELOPER_DIR="$HOME/Downloads/Xcode 3.app/Contents/Developer"`,
   then `xcodebuild -version` **must** say 26.3. (`xcode-select` has silently
   reset to Xcode 16 before, and ASC rejects iOS 18 SDK builds.)
5. **Verify the export keys rather than trusting the PC:**
   `xcodebuild -help | grep -A2 -E "destination|manageAppVersionAndBuildNumber"`.
   `ios/App/ExportOptions.plist` sets `destination=upload` and
   `manageAppVersionAndBuildNumber=true` (Xcode bumps the build number, so
   nobody hand-edits `CURRENT_PROJECT_VERSION`). If either key isn't listed,
   stop and report.
6. Simulator pass, one simulator at a time (iPhone 16 Plus, iOS 18.0). Build
   with `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16 Plus,OS=18.0' -derivedDataPath build/sim build`,
   install `build/sim/Build/Products/Debug-iphonesimulator/App.app` with
   `xcrun simctl install booted …`, launch `com.seanmurray.wolfram`, and
   inspect it from Safari → Develop → Simulator. Check spec criteria:
   - (2) `(await navigator.serviceWorker.getRegistrations()).length` is 0.
   - (3) Finish onboarding and log a class. Then `localStorage.clear()`,
     quit, and relaunch: the class and settings come back (from the
     Documents data file).
   - (4) Settings → Export backup opens the share sheet with
     `wolfram-backup-YYYY-MM-DD.json`.
   - (5) Start an impact set, tap the first jump, go to the Home screen: a
     "Next jump" notification arrives after ~30 s (allow notifications when
     asked).
   Record what passed, with evidence, in `PROJECT.md`.
7. Archive and upload:
   `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath build/Wolfram.xcarchive -allowProvisioningUpdates archive`
   then
   `xcodebuild -exportArchive -archivePath build/Wolfram.xcarchive -exportOptionsPlist ios/App/ExportOptions.plist -exportPath build/export -allowProvisioningUpdates`.
   If it sits at "Sending analysis…" for more than ~10 min, see Pounz's
   `PROJECT.md` incident of 2026-08-05 (corrupt CDN upload session: kill
   xcodebuild, delete the `CDUploads/*.plist`, re-run).
8. Confirm in App Store Connect → Wolfram → TestFlight that the build
   appears and finishes processing. Note its version and build number.
9. `PROJECT.md`: dated Done-ledger rows (simulator pass, upload), a Release
   log row, update Status. Commit named files only, push. If `cap sync`
   rewrote `ios/App/CapApp-SPM/Package.swift` on the Mac, commit it too.

## Don't

- Don't upgrade Capacitor (pinned 7.6.7 to match Pounz) or accept any Xcode
  "update project settings" prompt.
- Don't re-run `npx cap add ios`.
- Don't hand-edit `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION`.
- Don't commit anything personal about the user (public repo; see
  `CLAUDE.md` → Hard constraints).

## After the upload (PC / browser)

TestFlight → External Testing: create a group, add the user's email, submit
the build for Beta App Review (first build only), and fill in whatever the
form requires. Read the form in the console; don't assume what it asks.
