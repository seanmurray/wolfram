# Wolfram — project status

**Last updated:** 2026-10-26 — forked from Perennial, rebranded, repo + Pages live; program still Perennial's.

Section headers stay fixed so both machines and every session find things.
Newest entries go at the TOP of each list. Keep the Last-updated line to one
sentence; history lives in Release log / Incidents, not here.

## Status

- Web: https://seanmurray.github.io/wolfram/ — **scaffold, not ready to share.**
  Brand, palette, storage and deploy are Wolfram's; the training program is
  still Perennial's gentle three-day plan until the spec below is built.
- Android: n/a (personal PWA)
- iOS: n/a — installed to the iPhone Home Screen as a PWA (see Decisions)

## Done ledger (dated — never redo these)

| Date | Step | Where | Notes |
|---|---|---|---|
| 2026-10-26 | Forked from Perennial `8945518` (tracked files only, fresh history) | `C:\dev\personal\wolfram` | Perennial artwork, README, person-specific comments removed |
| 2026-10-26 | Template layer applied | repo | `.gitattributes`, `.editorconfig`, `.githooks` (pre-commit check, pre-push build), `.claude/settings.json`, `check-live.mjs` |
| 2026-10-26 | GitHub repo created (public) + Pages enabled (`build_type=workflow`) | `seanmurray/wolfram` | Pages enabled *before* first push, so the first run can't fail on it |

## Backlog (top = next)

1. Spec the program: bone-loading strength + impact, class guide, class logging, gap-filler — `docs/specs/program-and-classes.md`
2. Replace `src/data/program.js` + `exercises.js` with the bone-loading program (home-gym equipment-aware)
3. Class guide + weekly free-window planner ("what to book this week")
4. Class logging + weekly loading tally + gap-filler suggestions
5. Unit tests (vitest) for the loading tally / gap-filler math; add to `npm run check`
6. Final brand artwork — `brand/mark.svg` is a placeholder (lit filament "W"); Sean may supply art, as he did for Perennial
7. Install-to-Home-Screen prompt for iOS Safari (persistence depends on it)

## Blockers

- None.

## Decisions (with "do not chase")

| Date | Decision | Why | Do NOT reopen unless |
|---|---|---|---|
| 2026-10-26 | No ClassPass integration; class schedule comes from the user's own free windows + a class-type guide | ClassPass's only API is the partner-only Inventory API for venues — nothing reads a member's schedule or bookings (checked developers.classpass.com 2026-10-26) | ClassPass publishes a member-facing API |
| 2026-10-26 | iPhone PWA (Home Screen install), not a native shell | Safari 17+ supports the Storage API and WebKit grants `persist()` heuristically, favouring Home Screen web apps; same quota as the browser (webkit.org/blog/14403, read 2026-10-26). Local-first hardening (IDB mirror, snapshot, export) carried over from Perennial | Data loss observed on the device despite Home Screen install |
| 2026-10-26 | Every storage key, IDB name, and Cache Storage name is `wolfram-`-prefixed | All `seanmurray.github.io/*` project pages share one origin — and with it localStorage, IndexedDB and Cache Storage — with Perennial and soccer-coach | Never |
| 2026-10-26 | Public repo; no personal details in committed files | Both working Pages repos are public; Pages-on-private needs a paid plan, which couldn't be confirmed (`gh api user` → `plan: null`). The person this is for is described by goals only | Repo goes private |
| 2026-10-26 | Studio-warm look: bone canvas, filament-ember accent, graphite ink; Fraunces display + DM Sans body | Sean's pick; tungsten = density, "heavy stone", warm light. All text colours ≥ 4.5:1 on bg and card | Sean asks for a new direction |
| 2026-10-26 | Personal app, GitHub Pages (not Cloudflare Workers) | Sean chose "personal, like Perennial"; Workers default is for commercial work | Promoted to an MML product — then also rename (Wolfram is a Wolfram Research trademark) |

## Incidents (root cause, not symptoms)

| Date | What broke | Root cause | Fix / rule added |
|---|---|---|---|

## Release log

| Date | Version | Build | Target | Status |
|---|---|---|---|---|

## Needs the other machine

- None — web only.
