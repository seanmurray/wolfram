# Add a class from a screenshot — 2026-11-04

Status: **approved by Sean 2026-11-04; partly built.** It comes from TestFlight
feedback on 1.0 (4) (2026-10-28): the tester wanted to skip the Add a class form,
"give it a screenshot of the class or like paste the link".

**Built (web + JS, 2026-11-04):**
- `lib/readClass.js` for class pages;
- the paste box, the found-classes list, and link saving;
- the share-queue pickup (`App.jsx` → `importStore`);
- `lib/classReader.js`, a no-op until the plugin exists;
- the privacy page line;
- the schedule layout (later the same day, from a real schedule screenshot);
- the studio from ClassPass's share message (from three real ones).

**Not built:** the native half (ClassReader plugin, share extension, App Group),
which is the Mac's job: see `HANDOFF.md`.

## Goal

The user finds classes in the ClassPass app, and typing each one into Wolfram by
hand (name, studio, day, time, kind) is the step they don't want to do. They should
be able to give Wolfram a screenshot instead. Either one class's page or a studio's
schedule works, by any of three routes:

- **Share sheet:** Share → Wolfram, straight from the screenshot preview or Photos.
  ClassPass's own Share button sends an invite message that names only the
  studio (Open question 2), so sharing from it fills in the studio and saves its
  link, but can't fill in the class.
- **In the app:** a "From a screenshot" button that opens the photo picker.
- **Paste:** text copied from a screenshot, or a ClassPass link.

Wolfram reads the screenshot on the phone, fills in the class, and the user checks
it and taps Add. A pasted or shared ClassPass link is saved with the studio, so
"Find a class" opens it. Nothing leaves the phone, like the rest of the app.

## Non-goals

- **Opening Wolfram automatically from the share sheet.** Apple doesn't allow it:
  "App extensions are not allowed to open URLs directly … a deliberate design
  choice" (Apple DTS, developer.apple.com/forums/thread/764570). The workaround
  people use (finding `UIApplication` through the responder chain) is the hack
  Apple warns against, and there are reports of share extensions failing to open
  their app on iOS 26 (forums thread 839811). Instead, the share sheet saves the
  item for Wolfram. Wolfram picks it up the next time it opens or comes to the
  front.
- **Fetching anything from ClassPass.** The app makes no network requests. See
  Design notes for why a link can't name the class anyway.
- **Reading screenshots in the web version.** The web version gets the paste box
  only. Bundling an open-source text reader would add several MB, and it reads
  less accurately than Apple's.
- **Keeping the image.** A shared screenshot is held only until Wolfram reads it,
  then deleted. Only the classes the user adds are saved.
- **Deciding Heavy from the description.** The kind stays a guess from the class
  name (`classifyClass`) that the user confirms. "Did you go heavy?" still settles
  each logged class.
- **Dated or one-off classes.** The library stays weekly and recurring, so only the
  weekday and start time are kept from a date.
- **Booking, credits, waitlists.**

## User flow

### Share sheet (iPhone app)

1. The user takes a screenshot in ClassPass, taps the preview, taps **Share** and
   picks **Wolfram**. They can also share an older screenshot from Photos, or tap
   ClassPass's own **Share** button and pick Wolfram.
2. A small Wolfram sheet confirms: "Saved for Wolfram. Open Wolfram to check it
   and add it." The user taps **Done**. Sharing several screenshots before opening
   Wolfram is fine: they queue.
3. The next time Wolfram opens or comes to the front, it goes to **Classes**.
   It reads everything that was shared and shows the result as in step 3 of the
   in-app flow below.

### In the app

1. Classes → **+ Add a class**. Above the form there are two new options:
   **From a screenshot** (iPhone app only) and **Paste from ClassPass** (a text
   box).
2. **From a screenshot** opens the iPhone's photo picker, where the user picks one
   image. Cancelling leaves the form as it was.
3. Wolfram reads the text on the phone and works out the layout:
   - **One class:** the form fills in name, studio, day and time. The kind is
     guessed from the name, all marked "read from your screenshot". The user fixes
     anything wrong and taps **Add class**.
   - **A studio's schedule, or several shared screenshots:** a list shows "Found N
     classes" with each class's day, time and name, all unticked. The user ticks
     the ones they take and taps **Add N classes**. Any row can be opened in the
     normal form to fix it first. A row missing its name, day or time can't be
     ticked. It says what's missing ("Open it to add the day."), so nothing is
     added with a made-up day.
   - **Nothing recognisable:** "Couldn't find a class in that screenshot. Fill it
     in below." The form stays as it was.
4. **Paste from ClassPass** takes any text and runs it through the same reader:
   - words copied out of a screenshot in Photos (long-press → Select All → Copy);
   - ClassPass's share text;
   - a bare link.

### Links (paste or share)

When the text includes a ClassPass link, the form says "ClassPass link: saved with
the studio when you add this class". On Add:

- The studio field matches one of Your studios that has no link → the link is
  saved to that studio.
- It matches a studio that already has a link → the old link is kept, and a note
  says so.
- It matches none → a new studio is added to Your studios with that name and the
  link.
- The studio field is empty → "Add the studio's name to keep this link." The class
  can still be added without it.

With a link and no class, the studio field is filled from ClassPass's share
message ("… check out spots like <studio> 😊 <link>"), matched against Your
studios first. The form then says "A ClassPass link names the studio, not the
class. Share a screenshot of the class page instead, or fill it in below." On
the web, which can't read screenshots: "That link doesn't say which class or
when. Fill those in below."

## Data / API changes

**Web storage: none.** The reader produces drafts of the existing class shape,
`{ name, studio, weekday, time, format }`. Links go into the existing
`studios[].link` (`wolfram-classes`). No migration.

### `src/lib/readClass.js` (new, pure, unit-tested)

`readClasses(lines, { now, studios })` returns `{ classes: [draft], link }`: one
draft for a class page, several for a schedule.

- **Input:** `[{ text, x, y, w, h }]`, with positions normalised 0–1 from the
  top-left. Pasted text arrives as lines with no positions.
- **Times:** "6:00 PM", "6 PM", "18:00", and ranges ("6:00 – 7:00 PM", where the
  AM/PM is carried back from the end). Noon and midnight are handled. The start
  time is kept.
- **Day:** weekday words (Mon … Sunday). "Today" and "Tomorrow" mean the day the
  screenshot was taken, which can be days before it's read. So on a schedule
  they're worked out from the day tabs next to them ("Today", "Thu 5", … run one
  day apart). Without tabs they're worked out from `now`: the time it was shared
  for a shared item (`at`), else the time it's read.
- **24-hour schedules:** a phone set to 24-hour shows "16:30" and "09:00". On a
  schedule where nothing says AM or PM, every time is read as 24-hour. Where some
  do, a bare "6:30" is left blank for the user rather than guessed.
- **Studio:** a line matching one of Your studios wins. Otherwise the layout rule
  from the sample screenshots applies, and failing that the field is left blank.
- **Name:** the line that goes with each time. Times, dates, durations, credits,
  addresses and button labels are skipped.
- **Link:** `parseClassPassLink`, unchanged.

### Local Capacitor plugin `ClassReader` (new, iOS only, Swift, App target)

Uses Capacitor 7's
[custom native code](https://capacitorjs.com/docs/v7/ios/custom-code) pattern:
`CAPBridgedPlugin`, registered in `capacitorDidLoad()` of a
`CAPBridgeViewController` subclass. The storyboard's custom class changes from
`CAPBridgeViewController` to that subclass.

- `pickAndRead()` presents `PHPickerViewController` (images only, one at a time).
  It runs Vision's `VNRecognizeTextRequest` (accurate, English) on the picked
  image. It resolves `{ lines }` or `{ cancelled: true }`.
- `takeShared()` reads and clears the share queue in the App Group container. It
  runs the same Vision read on each image and resolves
  `{ items: [{ lines, at } | { text, at }] }`, where `at` is when the item was
  shared (ms since 1970). Each image file is deleted once it has been read.
- No third-party package. `@capacitor-community/image-to-text@7.0.0` ships only a
  CocoaPods podspec (no `Package.swift`, checked 2026-11-04), and this shell uses
  SPM. Its 8.x needs Capacitor 8, which is ruled out (Capacitor 7 ceiling).

### Share Extension target `WolframShare` (new, Swift, no Capacitor)

- Bundle ID `com.seanmurray.wolfram.share`. iOS deployment target is the same as
  the app's.
- `NSExtensionActivationRule` accepts one image, one web URL, or text.
- The extension's own small view controller says "Saved for Wolfram …" and has a
  Done button. It is not `SLComposeServiceViewController`, which shows a "Post"
  compose screen.
- It doesn't read or parse anything. It copies the image (or the URL and text) into
  the App Group container as a queued item with a timestamp, then completes the
  request. One parser and one reader stay in the main app.

### App Group `group.com.seanmurray.wolfram`

On both the app and the extension. It holds only the share queue, which is cleared
by `takeShared()`.

### `src/lib/classReader.js` (new)

- `canReadScreenshots()` (native only), `readScreenshot()`, and `takeShared()`.
- It checks the queue at launch and on every `visibilitychange` to visible (no new
  dependency). When it finds items, it switches to Classes.
- It must never return or resolve the plugin proxy itself. See PROJECT.md
  Incidents, 2026-10-26: the proxy answers `then`.

### `ClassesScreen.jsx`

Adds the two options, the found-classes list, the link-saving step, and the "read
from your screenshot" marking.

## Acceptance criteria

- [ ] 1. **Share sheet (device, TestFlight 1.0 (5)).** A ClassPass class-page
      screenshot, shared from the screenshot preview to Wolfram, shows "Saved for
      Wolfram". Opening Wolfram then lands on Classes with name, studio, day and
      time filled correctly. This holds for every sample class-page screenshot
      (Open question 1).
- [ ] 2. Three screenshots shared before Wolfram is opened all appear, in one
      "Found N classes" list. A second open afterwards shows nothing: the queue is
      cleared.
- [ ] 3. Wolfram is in the share sheet for images and for ClassPass's own Share
      button. Sharing from ClassPass saves its link by the rules in "Links (paste
      or share)".
- [ ] 4. **From a screenshot** opens the photo picker with **no permission prompt**
      and fills the form the same as criterion 1.
- [ ] 5. Share, picker and paste all work in **airplane mode**, which shows the
      reading happens on the phone.
- [ ] 6. A schedule screenshot lists every class on it (checked against the
      sample). Only the ticked ones are added, each with the right day and time.
- [ ] 7. A screenshot with no class (for example a photo) shows "Couldn't find a
      class…" and leaves the form unchanged. Cancelling the picker changes nothing.
- [ ] 8. **Paste from ClassPass**, in the web build and on the iPhone: text copied
      from a class page fills the form the same as the screenshot does.
- [ ] 9. Pasting a ClassPass link (a studio page, a `classpass.app.link` link, or an
      `/invite/…` link) and adding the class saves the link by the four rules.
- [ ] 10. The app makes no network request during any of this. Checked with the
      dev build's network log for paste, and with airplane mode on the device.
- [ ] 11. **Images aren't kept.** After an import:
      - the App Group container holds no images;
      - the web stores and the native data file hold only the added classes, plus
        a studio link if one came in.
- [ ] 12. The web build has no **From a screenshot** button, and the paste box works.
- [ ] 13. `readClass.test.js` covers:
      - both layouts;
      - 12-hour, 24-hour, ranges, noon and midnight;
      - weekday words, and Today/Tomorrow across a week boundary;
      - junk lines ignored (credits, durations, buttons, addresses);
      - studio matching against Your studios;
      - links pulled out of surrounding text.

      `npm run check` is clean.
- [ ] 14. A fresh install, onboarding first (the 2026-10-28 incident rule): the Add
      a class form, with the new options, sits clear of the status bar with and
      without the keyboard up. A share made before Wolfram has ever been opened
      waits until onboarding is finished.
- [ ] 15. `npm run build:native` (`cap sync ios`) leaves the extension target, its
      App Group entitlement and the storyboard change intact.

## Test plan

- **Unit (`node:test`):** `readClass.test.js`, using **invented** text that copies
  the layout of the real sample screenshots. The real samples never go in the
  repo: it's public, and they show the user's studios.
- **Web (browser tool, dev build at 375×812):** the paste flow, link saving, no
  screenshot button, and an empty network log.
- **Simulator (Mac, Xcode 26.3):** drop the sample screenshots into the
  simulator's Photos, then check:
  - Share → Wolfram, one and three at a time, then open Wolfram;
  - the picker;
  - both layouts;
  - cancel, and a photo with no class;
  - a fresh install;
  - `cap sync` leaving the target alone.
- **Device (the user's iPhone, TestFlight 1.0 (5)):** criteria 1–7 and 9 with
  real ClassPass screenshots and ClassPass's Share button, including airplane mode.

## Store / privacy impact

- **New on the Apple developer account** (done from the Mac, with Sean's OK at the
  time): the App Group `group.com.seanmurray.wolfram`, and the extension's App ID
  `com.seanmurray.wolfram.share`. The App Groups capability is turned on for both
  App IDs. Signing stays Xcode-managed (team 6RWD7M34MY). Check that
  `ExportOptions.plist` still exports with two targets.
- **No new permission strings.** The system photo picker runs outside the app and
  hands over only the picked image, so no photo-library usage string is needed,
  and there's no camera. Criterion 4 checks this on the device.
- App Privacy stays **"Data Not Collected"**: screenshots are read on the phone and
  deleted after reading.
- `public/privacy.html` gains one line: "Screenshots you pick or share to Wolfram
  are read on your phone to fill in a class, then deleted. They're never sent
  anywhere."
- **TestFlight:** 1.0 (5) goes to "Family/Friends" with What to Test describing
  the share sheet. If App Store Connect asks for Beta App Review again because of
  the new extension, submit it.

## Design notes (checked 2026-11-04)

- **What a ClassPass share link carries.** The pasted link was
  `classpass.com/invite/<code>?placement=VenueDetails`: a referral link from
  ClassPass's Share button on a studio's page. The URL holds only the invite code.
  The page it serves embeds the studio's `/studios/<slug>` path in its page data,
  under a field named `venueOrClassDetailUrl`. A studio's class pages give the
  same code as the studio's page, and other studios give other codes (Open
  question 2), so the URL picks out a studio, never a class. Getting the studio
  from the URL means
  fetching ClassPass's page, which:
  - breaks the app's no-network design;
  - is unreliable (ClassPass answered 403 to the first of two test fetches);
  - still wouldn't give the class name or time.

  So links are saved with the studio, never read.
- **The web schedule doesn't help either.** Logged-out
  `classpass.com/studios/<slug>` pages showed no bookable classes and have no class
  links. Screenshots from the app are the source.
- **What the class-page samples showed** (read with Windows' own text reader as a
  stand-in for Vision; the rules are in the header comment of `lib/readClass.js`):
  - The date line, "Wed, Nov 4 · 6:00 PM – 7:00 PM", is the anchor. It reads back
    as `wed, Nov4-6:OO PM -7:00 PM`, and the back button can hide the W, so the
    day is worked out from the date.
  - The studio line is `<studio> • <town> >`, and the back button can hide its
    first word. Matching against Your studios still finds it.
  - Once the page scrolls, the class name sits under the status bar and isn't
    read. The form then says so and asks for a screenshot from the top, instead
    of guessing.
  - Reviews below the Share/Add row name other classes, so nothing below that
    row is read.

  On the two scrolled samples the reader got the day and time right, and the
  studio too once it was saved in Your studios. On the third, shot from the top
  before scrolling, it read all four: name, studio and town, day, time.
- **What the schedule sample showed** (same stand-in reader):
  - At the top, the studio's name over "View details >", then day tabs "Today",
    "Thu 5", "Fri 6" …, one day apart.
  - Then a heading per day, and one row per class: the time on the left, the
    class name level with it, and below them the length ("60 min"), the teacher
    and the credits. The text reader returns the time and the name separately,
    and the bigger name starts a little higher, so rows are matched by their
    middles.
  - The phone was set to 24-hour, so the times read "16:30" and "06:00", with no
    AM/PM anywhere on the screen.
  - The status-bar clock reads like a class time and is dropped.
  - A second schedule, from a phone set to 12-hour time, read "6:00 pm" style
    times, a trial note under each teacher, and the first two tabs as one line
    ("Today Thu 5"). All six classes on it came out right with no change.

  The reader found all seven classes on the sample, each with the right day, time
  and name. "Today" still came out as the screenshot's Wednesday when the reading
  was done as if on a Saturday.
- **The share sheet can't open the app.** See Non-goals. The queue-and-pick-up
  design means one extra step for the user: opening Wolfram. Picking up on
  `visibilitychange` means switching back to an open Wolfram is enough.

## Open questions

1. ~~**Sample screenshots.**~~ Answered 2026-11-04: three class pages (one shot
   from the top) and a studio's schedule. They're kept on the PC in
   `C:\dev\personal\wolfram-samples\`, outside the repo. A second class page and
   a schedule from a phone set to 12-hour time came the same evening, and both
   read right as they were.
2. ~~**What does ClassPass's Share button send** for a class?~~ Answered
   2026-11-04, from Sean's own account: on a class page it sends the same invite
   message as on a studio's page, "Here's 14 workouts on me! I've been using
   ClassPass to check out spots like <studio> 😊
   https://classpass.com/invite/<code>?placement=VenueDetails". No class name or
   time. Three studios gave three different codes, so the link does belong to the
   studio, and the reader takes the studio from "spots like …". The screenshot
   stays the way to fill in a class. Still unchecked: whether Share → Wolfram
   passes the message's words along with the link (the Mac's simulator check
   will show it).
3. **Does an `/invite/…` link open the studio for a member** in the ClassPass app,
   or only the "Join your friends" page? Device check. If it only reaches the
   invite page, `/invite/…` links aren't saved and the form says so. Studio-page
   and `classpass.app.link` links still are.
4. **A one-tap way back.** Apple's suggestion is a local notification ("Tap to add
   it in Wolfram"). Can the extension post one using the app's existing
   notification permission? Apple's engineer hadn't tested this for share
   extensions. Try it on the device: keep it if it works, drop it if not. The
   queue works either way.
