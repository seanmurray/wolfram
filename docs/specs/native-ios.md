# Spec: native iOS app via TestFlight

**Status:** CONFIRMED by Sean 2026-10-26 (TestFlight, user invited as an
external tester by email). PC side built 2026-10-26; criterion 1 verified.
Criteria 2–5 wait on the Mac (`HANDOFF.md`), 6 on the user's iPhone.

The Home Screen web app works, but a real app gives the user an icon that
behaves like every other app, alerts with the screen off, and storage that
isn't Safari's. Same code; Capacitor wraps it, the way Pounz and soccer-coach
already ship.

## Goals

1. **Capacitor 7 iOS shell.** Pins match Pounz exactly (`@capacitor/*`
   7.6.7, filesystem 7.1.8, share 7.0.4, local-notifications 7.0.7). Swift
   Package Manager, like Pounz. Bundle `com.seanmurray.wolfram`, team
   `6RWD7M34MY` (Murray Movement Labs LLC, the account soccer-coach also
   ships under), home-screen name "Wolfram".
2. **Durable data on native.** Capacitor's storage guide says iOS "will reclaim
   local storage from Web Views if a device is running low on space", and the
   same for IndexedDB. So every successful save is also written to a JSON file
   in the app's own data directory, and boot recovery restores from that file
   when web storage comes up empty. The web build keeps its existing
   localStorage + snapshot + IndexedDB mirror unchanged.
3. **No service worker in the native shell.** Inside the WebView it serves
   the previous build after every sync (playbook rule). Native unregisters any
   SW and clears its caches; the web build registers as before.
4. **Bundled fonts.** Fraunces, DM Sans and DM Mono ship with the app (OFL).
   No Google Fonts requests on web or native: works offline, and nothing
   leaves the device.
5. **Export through the native share sheet** on native (a blob download is a
   silent no-op in WKWebView). Import keeps the file picker; verify on device.
6. **Timer alerts with the screen off.** Rest and jump timers schedule a local
   notification for their end (soccer-coach's `timerNotification` approach);
   in the foreground the in-app sound plays as now.
7. **Icon and launch screen** from `brand/mark.svg`.

## Non-goals

- A public App Store release (one user; the "Wolfram" trademark).
- Android.
- Cloud sync or iCloud backup beyond what iOS does for app data.
- Moving to Expo.

## Acceptance criteria

1. The web build and Pages deploy are unchanged: `npm run check-live` passes
   after the change, and the web build still registers its service worker.
2. Native: no service worker is registered.
3. Native: after any save, the data file exists and holds the same sessions;
   with web storage wiped, relaunching restores them.
4. Native: Export opens the iOS share sheet with
   `wolfram-backup-YYYY-MM-DD.json`.
5. Native: a rest or jump timer that ends while the app is in the background
   delivers a notification.
6. The TestFlight build installs on the user's iPhone from an email invite;
   data survives force-quit and relaunch.

## Distribution

- App Store Connect app record under team `6RWD7M34MY`. If the name
  "Wolfram" is taken, the record gets a variant (e.g. "Wolfram Strength");
  the home-screen name stays "Wolfram". **Verify in the console.**
- External testing group with the user's email. The first build goes through
  Beta App Review; later builds usually don't need a full review.
- Each TestFlight build expires after 90 days, so upload at least every three
  months. Any update resets the clock.
- **Verify in the console, don't assume:** what external testing requires
  (contact info, beta description, privacy policy URL?) and the export
  compliance answer (no non-exempt encryption).

## Test plan

- Windows: `npm run check` + `npm run build`; web preview still registers its
  service worker; unit tests for any pure logic added.
- Mac: build with Xcode 26.3 (`DEVELOPER_DIR` prefix), simulator pass for
  criteria 2–5, archive, and upload.
- iPhone: TestFlight install, criterion 6.
