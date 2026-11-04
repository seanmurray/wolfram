# Add a class from a screenshot — 2026-11-04

Status: **draft, waiting for Sean's OK.** Comes from TestFlight feedback on 1.0 (4)
(2026-10-28). The tester wanted to skip the Add a class form: "give it a screenshot
of the class or like paste the link".

## Goal

The user finds classes in the ClassPass app. Typing each one into Wolfram by hand
(name, studio, day, time, kind) is the step they don't want to do. They should be
able to:

- pick a ClassPass screenshot, either one class's page or a studio's schedule; or
- paste text they copied from one.

Wolfram reads the screenshot on the phone, fills in the form, and the user checks
it and taps Add. A pasted ClassPass link is saved with the studio, so "Find a
class" opens it. Nothing leaves the phone, the same as the rest of the app.

## Non-goals

- **Share sheet** ("Share → Wolfram" from the screenshot preview). That needs an
  iOS Share Extension: a second app target, with more Mac work. It can follow once
  this works.
- **Fetching anything from ClassPass.** The app makes no network requests (see
  Design notes for why a link can't name the class anyway).
- **Reading screenshots in the web version.** The web version gets the paste box
  only. Bundling an open-source text reader would add several MB, and it reads
  less accurately than Apple's.
- **Keeping the image.** Wolfram reads the screenshot, then lets it go. Only the
  classes the user adds are saved.
- **Deciding Heavy from the description.** Kind stays a guess from the class name
  (`classifyClass`), which the user confirms. "Did you go heavy?" still settles
  each logged class.
- **Dated or one-off classes.** The library stays weekly and recurring, so only the
  weekday and start time are kept from a date.
- **Booking, credits, waitlists.**

## User flow

1. Classes → **+ Add a class**. Above the form, two new options:
   **From a screenshot** (iPhone app only) and **Paste from ClassPass**, a text box.
2. **From a screenshot** opens the iPhone's photo picker. The user picks one image.
   Cancelling leaves the form as it was.
3. Wolfram reads the text in the image on the phone and works out the layout:
   - **One class's page:** the form fills in (name, studio, day, time) and the kind
     is guessed from the name, marked "read from your screenshot". The user fixes
     anything wrong and taps **Add class**.
   - **A studio's schedule:** a list shows "Found N classes" with the day, time and
     name for each, all unticked. The user ticks the ones they take and taps
     **Add N classes**. Each row can be opened in the normal form to fix it first.
   - **Nothing recognisable:** "Couldn't find a class in that screenshot. Fill it
     in below." The form stays as it was.
4. **Paste from ClassPass** takes any text: words copied out of a screenshot in
   Photos (long-press → Select All → Copy), ClassPass's share text, or a bare link.
   It runs through the same reader as a screenshot and fills the form the same way.
5. If the pasted text has a ClassPass link in it, the form says "ClassPass link: saved
   with the studio when you add this class". On Add:
   - The studio field matches one of Your studios with no link → the link is saved
     to that studio.
   - It matches a studio that already has a link → the old link is kept, and a note
     says so.
   - It matches none → a new studio is added to Your studios with that name and
     the link.
   - The studio field is empty → "Add the studio's name to keep this link."
     The class can still be added without it.

## Data / API changes

- **No storage changes.** The reader produces drafts of the existing class shape
  `{ name, studio, weekday, time, format }`. Links go into the existing
  `studios[].link` (`wolfram-classes`). No migration.
- **New `src/lib/readClass.js`**, pure and unit-tested:
  - `readClasses(lines, { now, studios })` takes lines as
    `[{ text, x, y, w, h }]` (positions normalised 0–1, top-left origin; pasted
    text becomes lines with no positions). It returns
    `{ classes: [draft], link }`, with one draft for a class page and several for
    a schedule.
  - **Times:** reads "6:00 PM", "6 PM", "18:00", and ranges ("6:00 – 7:00 PM",
    where the AM/PM is carried back from the end). Noon and midnight are handled.
    The start time is kept.
  - **Day:** read from weekday words (Mon … Sunday). "Today" and "Tomorrow" are
    worked out from `now`.
  - **Studio:** a line matching one of Your studios wins. Otherwise the layout
    rule from the sample screenshots applies; failing that, the field is left blank.
  - **Name:** the line that goes with each time, skipping anything that isn't a
    class name: times, dates, durations, credits, addresses, button labels.
  - **Link:** `parseClassPassLink`, unchanged.
- **New local Capacitor plugin `ClassReader`** (iOS only, Swift, inside the App
  target). It follows Capacitor 7's
  [custom native code](https://capacitorjs.com/docs/v7/ios/custom-code) pattern:
  - `CAPBridgedPlugin`, registered in `capacitorDidLoad()` of a
    `CAPBridgeViewController` subclass. The storyboard's custom class changes
    from `CAPBridgeViewController` to that subclass.
  - `pickAndRead()` presents `PHPickerViewController` (images only, one at a time).
    It runs Vision's `VNRecognizeTextRequest` (accurate, English) on the picked
    image and resolves `{ lines }` or `{ cancelled: true }`.
  - No third-party package. `@capacitor-community/image-to-text@7.0.0` ships only
    a CocoaPods podspec (no `Package.swift`, checked 2026-11-04), and this shell
    uses SPM. Its 8.x needs Capacitor 8, which is ruled out (memory: Capacitor 7
    ceiling).
- **New `src/lib/classReader.js`:** `canReadScreenshots()` (native only) and
  `readScreenshot()`. It must never return or resolve the plugin proxy itself:
  see PROJECT.md Incidents, 2026-10-26 (the proxy answers `then`).
- **`ClassesScreen.jsx`:** adds the two options, the found-classes list, the
  link-saving step, and the "read from your screenshot" marking.

## Acceptance criteria

- [ ] 1. iPhone (TestFlight 1.0 (5)): **From a screenshot** opens the photo picker
      with **no permission prompt**. Picking a ClassPass class page fills name,
      studio, day and time correctly for every sample class-page screenshot
      (Open question 1). The kind follows the name.
- [ ] 2. The same works in **airplane mode**, which shows the reading happens on
      the phone.
- [ ] 3. A schedule screenshot shows every class on it (checked against the
      sample) and adds **only** the ticked ones, each with the right day and time.
- [ ] 4. A screenshot with no class in it (e.g. a photo) shows "Couldn't find a
      class…" and leaves the form unchanged. Cancelling the picker changes nothing.
- [ ] 5. **Paste from ClassPass**, in the web build and on the iPhone: text copied
      from a class page fills the form the same as the screenshot does.
- [ ] 6. Pasting a ClassPass link (studio page, `classpass.app.link`, or an
      `/invite/…` link) and adding the class saves the link to Your studios by
      the four rules in User flow step 5.
- [ ] 7. No network request from the app during any of this: the dev build's
      network log during paste, and airplane mode on the device.
- [ ] 8. The image isn't kept. After an import, the stores and the native data
      file hold only the added classes (and a studio link, if one was pasted).
- [ ] 9. The web build has no **From a screenshot** button. The paste box works.
- [ ] 10. Unit tests in `readClass.test.js` cover:
       - both layouts;
       - 12-hour, 24-hour, ranges, noon and midnight;
       - weekday words, Today and Tomorrow across a week boundary;
       - junk lines (credits, durations, buttons, addresses) ignored;
       - studio matching against Your studios;
       - links pulled out of surrounding text.
       `npm run check` is clean.
- [ ] 11. A fresh install (onboarding first, per the 2026-10-28 incident rule):
      the Add a class form with the new options sits clear of the status bar,
      with and without the keyboard up.

## Test plan

- **Unit** (`node:test`): `readClass.test.js`, using **invented** text that copies
  the layout of the real sample screenshots. The real samples never go in the
  repo (it's public; they show the user's studios).
- **Web** (browser tool, dev build at 375×812): paste flow, link saving, no
  screenshot button, network log empty.
- **Simulator** (Mac, Xcode 26.3): drop the sample screenshots into the
  simulator's Photos. Then the picker, reading, both layouts, cancel, a non-class
  photo, and a fresh install.
- **Device** (the user's iPhone, TestFlight 1.0 (5)): criteria 1–4 and 6, with
  real ClassPass screenshots, including airplane mode.

## Store / privacy impact

- **No new permission strings.** The system photo picker runs outside the app and
  hands over only the picked image, so no photo-library usage string is needed,
  and there's no camera. Criterion 1 checks this on the device.
- App Privacy stays **"Data Not Collected"**: screenshots are read on the phone
  and not kept.
- `public/privacy.html` gains one line: "Screenshots you pick are read on your
  phone to fill in a class, then discarded. They're never saved or sent."
- Beta App Review: TestFlight 1.0 (5) goes to "Family/Friends" with What to Test
  describing the feature. A later build in an approved group has gone straight to
  Testing before (1.0 (2)–(4)).

## Design notes (checked 2026-11-04)

- **What a ClassPass share link carries.** The pasted link was
  `classpass.com/invite/<code>?placement=VenueDetails`, a referral link from
  ClassPass's Share button on a studio's page. The URL holds only the invite code.
  The page it serves embeds the studio's `/studios/<slug>` path in its page data,
  in a field named `venueOrClassDetailUrl`. That field name suggests sharing a
  class may carry a class page instead (not checked). Getting even the studio
  means fetching ClassPass's page, which:
  - breaks the app's no-network design;
  - is unreliable (ClassPass answered 403 to the first of two test fetches);
  - still wouldn't give the class name or time.
  Hence: links are saved with the studio, never read.
- **The web schedule doesn't help either.** Logged-out
  `classpass.com/studios/<slug>` pages showed no bookable classes, and there are
  no class links on them. Screenshots from the app are the source.

## Open questions

1. **Sample screenshots (needed before building the reader).** 3–5 real
   ClassPass screenshots from the user's phone: a couple of class pages and a
   couple of studio schedules. They stay on Sean's machine, outside the repo. The
   reader's layout rules are built from them; without them those rules are
   guesses.
2. **Does an `/invite/…` link open the studio for a member?** In the ClassPass
   app, does it go to the studio, or only to the "Join your friends" page?
   Device check. If it only reaches the invite page, `/invite/…` links aren't
   saved (the form says so). Studio-page and `classpass.app.link` links still
   are.
3. Share Extension as a follow-up once this has been used for a while.
