# Spec: My studios and "Find a class"

Status: approved for build 3 (2026-10-28), after the on-device pass on build 2.

## Problem

The user's favourite studios have to be retyped every time a class is added,
and the planner's "search ClassPass for a barbell class" nudge leaves the
searching entirely to them. A live ClassPass lookup is ruled out: ClassPass
has no member API (PROJECT.md → Decisions, 2026-10-26), scraping breaks its
terms and would break whenever the site changes, and it would send the user's
location off the device.

## Goals

1. **My studios** (Settings): the user lists the studios they like, each with
   a name and an optional town ("Studio name · Town"). Stored on the device,
   exported with backups, never committed or sent anywhere.
2. Adding or logging a class offers My studios first, so a favourite is one
   tap, not retyped. A class's `studio` field keeps holding free text, so
   existing classes are unaffected.
3. **Find a class**: buttons that hand off to ClassPass with the search
   already filled in. The user searches and books in ClassPass; the app gets
   them there in one tap.
   - On a My studios row: search ClassPass for that studio (and town).
   - On the gap-filler's "Room for a heavy class" card: search ClassPass for
     "barbell", next to the existing search guide.
4. Studio formats keep their honest bucket: yoga of any kind, hot yoga
   included, counts as Studio (balance and mobility), never Heavy or Impact.
   The existing keyword classifier already does this; My studios doesn't
   change it.

## Non-goals

- Reading ClassPass schedules, availability, credits or bookings.
- Location access, or "near me" suggestions computed by the app.
- Any studio names, towns or other personal details in committed code,
  fixtures or docs (public repo). Tests use invented names.

## Design notes

- The handoff is an ordinary external link. Capacitor hands navigation to
  outside URLs to iOS (check this on the simulator first). If the ClassPass
  app is installed, iOS opens it through ClassPass's universal links; otherwise
  Safari opens classpass.com. **Before building, confirm ClassPass's current
  search URL format on classpass.com and whether it accepts a query
  parameter.** If it doesn't, fall back to opening the search page and
  copying the query to the clipboard, with a one-line "Paste to search" note.
- Data: `wolfram-studios`: `[{ id, name, town }]`, in the settings store so
  it rides along with prefs in export/restore (same path as skip days).
- Remove a studio: classes that name it keep their free-text studio.

## Acceptance criteria

1. Add a studio in Settings; it appears first in the Add a class studio
   picker; picking it fills the studio field.
2. Export → wipe → restore brings My studios back.
3. A My studios row's "Find a class" opens ClassPass (app or site) with a
   search for that studio; the heavy-gap card's button searches "barbell".
4. A class named "Hot Yoga 60" is suggested as Studio.
5. No network request is made by the app itself for any of this (the only
   traffic is the system opening the link).

## Store / privacy impact

None: no new permissions, no data leaves the device. App Privacy answers
stay "Data Not Collected".
