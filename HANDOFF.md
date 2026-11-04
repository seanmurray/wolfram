# HANDOFF — Mac: TestFlight 1.0 (5), add a class from a screenshot

**Written:** 2026-11-04 on the PC. **For:** the Mac (iOS station).
Read `PROJECT.md` first, then the spec `docs/specs/class-from-screenshot.md`
(approved by Sean 2026-11-04), then this.

## State

- **The JS half is built and live on the web:**
  - `lib/readClass.js` reads a class page;
  - the paste box, the found-classes list, link saving and the share-queue
    pickup are in `App.jsx` and `ClassesScreen.jsx`;
  - `lib/classReader.js` calls the native plugin and stays a no-op until
    `Capacitor.isPluginAvailable('ClassReader')` is true, so a native build
    without the plugin is unchanged.
- **Your job is the native half:** the `ClassReader` plugin, the `WolframShare`
  extension and the App Group. Nothing native exists yet.
- **Sample screenshots** are on the PC only, in `C:\dev\personal\wolfram-samples\`.
  Ask Sean to AirDrop a couple of ClassPass screenshots to the Mac for the
  simulator. **Never commit them** (public repo).

## The contract the JS expects (don't change it without changing the JS)

Plugin `jsName` **`ClassReader`**, both methods returning promises:

- `pickAndRead()`:
  - Presents `PHPickerViewController` (images only, `selectionLimit = 1`).
  - On cancel, resolves `{ cancelled: true }`.
  - Otherwise, resolves `{ lines: [{ text, x, y, w, h }] }`.
- `takeShared()`:
  - Reads every item in the App Group share queue, oldest first.
  - Resolves `{ items: [ { lines: [...], at } | { text: "…", at } ] }`: `lines`
    for an image, `text` for a shared URL and/or text (join them with a newline).
    `at` is when the extension queued it, in ms since 1970 (the timestamp you
    store with the item). The JS uses it so "Today" on a schedule means the day
    it was shared, not the day Wolfram was opened.
  - Then **deletes** the queue, images included. Resolves `{ items: [] }` when
    the queue is empty.

How to fill `lines`:

- Vision `VNRecognizeTextRequest`: `.accurate`, `recognitionLanguages = ["en-US"]`,
  `usesLanguageCorrection = true`.
- One entry per observation, using its top candidate's string.
- Positions are normalised 0–1 with a **top-left** origin. Vision's `boundingBox`
  has a bottom-left origin, so set `y = 1 - (box.origin.y + box.height)`.
  `x`, `w` and `h` are taken straight from the box.
- Run it off the main thread. Don't keep the image after reading.

## Steps

1. `cd ~/dev/wolfram && git pull --ff-only`, then
   `PATH="/usr/local/opt/node@22/bin:$PATH" npm ci`, `npm run check` (all tests
   pass), and `npm run build:native`.
2. `export DEVELOPER_DIR="$HOME/Downloads/Xcode 3.app/Contents/Developer"`.
   `xcodebuild -version` must say 26.3.
3. **Ask Sean before each developer-account change.** These are new standing
   configuration on the account:
   - App Group `group.com.seanmurray.wolfram`;
   - App ID `com.seanmurray.wolfram.share` for the extension;
   - the App Groups capability on both App IDs.

   Xcode's automatic signing (team 6RWD7M34MY) registers them when you add the
   capability in Signing & Capabilities. Read what the dialog says before
   confirming. Record each change in the `PROJECT.md` Done ledger, with the date.
4. **Plugin, in the App target:**
   - Add `ClassReaderPlugin.swift`, following Capacitor 7's custom-code pattern
     (https://capacitorjs.com/docs/v7/ios/custom-code): `@objc(ClassReaderPlugin)`,
     `CAPPlugin, CAPBridgedPlugin`, `jsName = "ClassReader"`, and both methods
     declared as `CAPPluginReturnPromise`.
   - Add `MainViewController.swift` (`class MainViewController: CAPBridgeViewController`).
     It overrides `capacitorDidLoad()` with
     `bridge?.registerPluginInstance(ClassReaderPlugin())`.
   - In `Main.storyboard`, change the view controller's custom class from
     `CAPBridgeViewController` (module Capacitor) to `MainViewController`
     (module App).
   - **No new `Info.plist` usage strings.** The system picker needs none, and the
     spec counts that as a criterion.
5. **Share Extension:**
   - Add it with File → New → Target → Share Extension, named `WolframShare`,
     bundle `com.seanmurray.wolfram.share`, with the same deployment target as
     the app.
   - Replace the template's `SLComposeServiceViewController` with a plain
     `UIViewController`. It shows "Saved for Wolfram. Open Wolfram to check it
     and add it." and a Done button that calls `completeRequest`.
   - `NSExtensionActivationRule` (a dictionary, not TRUEPREDICATE):
     `NSExtensionActivationSupportsImageWithMaxCount = 1`,
     `NSExtensionActivationSupportsWebURLWithMaxCount = 1`,
     `NSExtensionActivationSupportsText = YES`.
   - Copy each image, or the URL/text, into the App Group container under
     `ShareQueue/`, timestamped. It's your call how; the plugin is the only
     reader.
   - **Don't** try to open the app from the extension (Apple: not allowed; see the
     spec's Non-goals).
   - Optional (Open question 4): try posting a local notification from the
     extension. Keep it only if it works on the device.
6. **Check criterion 15:** run `npm run build:native` again. The extension target,
   the App Group entitlements and the storyboard change must survive `cap sync`.
7. **Simulator** (iPhone 16 Pro / iOS 26.3), starting from a **fresh install**
   (onboarding first, per the 2026-10-28 incident rule). Drop the AirDropped
   screenshots into Photos, then check:
   - Share → Wolfram shows the sheet. Opening Wolfram lands on Classes with the
     class filled in.
   - Three shares, then one open, gives one "Found N classes" list. Opening
     again shows nothing.
   - A studio-schedule screenshot gives "Found N classes" with one row per class
     on it, each with its day and time.
   - **From a screenshot** opens the picker with no permission prompt, and
     cancelling changes nothing.
   - A screenshot with no class gives "Couldn't find a class…".
   - Afterwards the App Group container holds no images.

   Record the results in the `PROJECT.md` Done ledger.
8. **Upload:** archive and upload as for 1.0 (4) (`archive`, then
   `-exportArchive` with `ios/App/ExportOptions.plist`).
   - Check the export picks up a provisioning profile for both targets.
   - Xcode bumps the build number; don't hand-edit it.
   - In App Store Connect → TestFlight, add 1.0 (5) to "Family/Friends". Suggested
     What to Test: "Add a class from a screenshot: share a ClassPass screenshot
     to Wolfram, or use From a screenshot on Add a class. Screenshot the class
     page before scrolling so the name is in it." Read the console; if it asks
     for review because of the extension, submit it.
9. **`PROJECT.md`:** dated Done-ledger and Release-log rows, Status, and backlog
   item 2. Commit named files only, then push. If `cap sync` rewrote
   `ios/App/CapApp-SPM/Package.swift`, commit that too.

## Don't

- Don't upgrade Capacitor (pinned 7.6.7), add an OCR package, or accept any
  Xcode "update project settings" prompt.
- Don't hand-edit `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION`.
- Don't commit screenshots, studio names, or anything personal about the user
  (public repo; see `CLAUDE.md` → Hard constraints).
