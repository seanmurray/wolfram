# Spec: My studios and "Find a class"

Status: built for 1.0 (3) (2026-10-28). Where this differs from the first draft, the
build wins: studios live on the Classes tab (next to the class list, where
they're used), in `wolfram-classes`, with an optional ClassPass link.

## Problem

The user's favourite studios have to be retyped every time a class is added,
and the planner's "search ClassPass for a barbell class" nudge leaves the
searching entirely to them. A live ClassPass lookup is ruled out: ClassPass
has no member API (PROJECT.md → Decisions, 2026-10-26), scraping breaks its
terms and would break whenever the site changes, and it would send the user's
location off the device.

## Goals

1. **Your studios** (Classes tab): the user lists the studios they like, each
   with a name, an optional town and an optional ClassPass link. Stored on the device,
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

- Checked 2026-10-28: ClassPass's search box puts nothing in the URL
  (`/search?q=` is ignored), so a link can't open a filled-in search. Studio
  pages have stable links (`/studios/<slug>`), but the slugs are irregular,
  so the app never guesses one: the user pastes it from ClassPass's Share
  button. With a link, "Find a class" opens the studio page; without one, it
  opens `classpass.com/search` and copies "name town" with a "Paste it into
  ClassPass search" note. The heavy-gap button copies "barbell".
- The handoff is an ordinary `target="_blank"` link; Capacitor hands it to
  iOS (verified on the simulator: Safari opened classpass.com/search). With
  the ClassPass app installed, iOS should open it there via universal links;
  check on the device.
- Data: `studios: [{ id, name, town, link }]` in the class store
  (`wolfram-classes`), so it rides along with the class library in backups.
  Links are parsed by `lib/classpass.js` (ClassPass hosts only, https).
- Remove a studio: classes that name it keep their free-text studio.

## Acceptance criteria

1. Add a studio on the Classes tab; it appears as a quick pick in the Add a class studio
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
