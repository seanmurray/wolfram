# Spec: program, class guide & gap-filler

**Status:** BUILT 2026-10-26, verified locally against criteria 1–10 (not yet deployed). Confirmed by Sean 2026-10-26 (see
"Decisions from Sean").

Wolfram is for someone heading into their 40s and 50s who loves studio classes
(yoga, pilates, barre) and wants to build and hold bone. Classes stay the
centre of the week. The app's job is to see what loading those classes
actually delivered and fill the gap, which is almost always heavy lifting and
impact.

## Why: the evidence, stated honestly

- **Bone responds to high-magnitude, fast, varied loading in short bouts.**
  Long repetitive low-load work (most studio formats) doesn't reach the strain
  bone adapts to.
- **Heavy resistance:** LIFTMOR (Watson et al., *JBMR* 2018;33(2):211-220).
  101 postmenopausal women (~65 y) with low bone mass did supervised 5×5
  at >85% 1RM, 2×/week, 30 min, for 8 months. Lumbar spine BMD +2.9% vs −1.2%
  in a low-intensity home-exercise control; femoral neck +0.3% vs −1.9%.
  *Caveat:* older, postmenopausal, supervised. It's evidence for the
  principle (heavy, low-rep, twice weekly, safe when progressed), not a
  protocol to copy for a 40-year-old beginner.
- **Impact:** Tucker et al., *Am J Health Promot* 2015;29(3):158-164.
  60 premenopausal women aged 25–50 did 10 or 20 jumps, 30 s rest between
  jumps, twice daily, for 16 weeks. Hip BMD was better than in controls.
  *Caveat:* the benefit was mostly that jumpers *held* bone that controls
  lost. That's maintenance, and maintenance before perimenopause is the point.
- **Studio work is kept and counted, not replaced.** Yoga and pilates build
  balance, mobility and muscular endurance, which matter for falls. They
  just don't supply the bone-loading stimulus.

## Goals

1. A weekly loading model with three buckets: **Heavy**, **Impact**, **Studio**.
2. A **class library** (the user's own recurring classes) and a **weekly
   planner** that highlights the ones that fill this week's gaps.
3. **One-tap class logging**, with a "did you go heavy?" check where it matters.
4. A **gap-filler**: one clear suggestion a day (class, home-gym session, or a
   5-minute impact set).
5. A **program**: a home-gym heavy session (equipment-aware), a 4-week ramp
   into heavy work, and a progressive impact set.
6. **Safety copy** that points to a DEXA baseline and a doctor, and doesn't
   play clinician.

## Non-goals (v1)

- ClassPass integration or booking: there is no member API (PROJECT.md → Decisions).
- Calendar sync.
- Tracking DEXA scores or making any diagnostic claims.
- Nutrition tracking.
- Cycle-synced programming.
- Social or sharing.

## Design

### Buckets and the class taxonomy

| Format (as named on ClassPass) | Counts as | Note |
|---|---|---|
| Barbell, lifting, powerlifting, Olympic lifting, "strength" | **Heavy**, only if "went heavy" = yes | Heavy = sets of ≤ 8 where the last two reps were a real fight |
| Bootcamp, HIIT, plyo, jump rope, dance cardio with jumps | **Impact** (+ Heavy if checked) | |
| Kettlebell | **Heavy** if checked, else Studio | |
| Reformer / mat pilates, barre, sculpt, "pump"-style high-rep | **Studio** | Light load × high reps builds muscle endurance, not bone |
| Yoga (any style) | **Studio** | Balance and mobility |
| Running | **Impact** | |
| Spin, rowing, swimming | **Cardio** (no bone credit) | Non-weight-bearing |

A keyword classifier suggests the bucket when a class is added; the user
confirms or changes it.

**ClassPass search guide** (a card in the planner): for Heavy, search
*barbell, lifting, powerlifting, strength*, then check the description for
"barbell" or "heavy". *Sculpt, tone, pump* almost never mean heavy.

### Weekly targets: defaults, adjustable with sliders (Settings)

| Variable | Default | Slider | Note |
|---|---|---|---|
| Heavy sessions / week | 2 | 0–4 | LIFTMOR's frequency |
| Hours between heavy sessions | 48 | 24–72 (step 12) | |
| Impact sets / week | 3 | 0–14 | One set = 10 jumps, 30 s apart, or an impact class |
| Studio classes / week | 0 = no target | 0–7 | Counted and celebrated either way |

**On the impact default:** Tucker's protocol was one set *twice a day*,
which is 14 a week. Three a week is an easy starting point well below the
studied dose, not the dose itself. The Settings copy says so, and the slider
goes up to 14 for when jumping feels routine.

Week = Monday–Sunday, local time.

### Where training happens

- **The home gym** (visited about once a week): barbell with fractional
  plates (1.25 lb, so 2.5 lb jumps on the bar), squat rack with spotter
  arms, pull-up bar, and dip attachment, a lifting platform, flat and incline
  benches, light dumbbells (2.5–10 lb), loadable dumbbells, 35 and 53 lb
  kettlebells, and medicine balls. This is the **only place the app's heavy
  session runs**, preset as the equipment list (editable in Settings).
- **At home:** a yoga mat, maybe light dumbbells later. Impact sets need
  nothing. Light dumbbells never count as Heavy.
- **Consequence:** one gym visit a week covers at most one Heavy session. The
  second Heavy normally has to come from a **barbell class**, which is why
  highlighting strength classes leads the planner. If none fits, the week
  honestly ends at Heavy 1/2 and the gap-filler leans on impact.

### Class library and weekly planner

- A library entry has: name, studio, weekday, time, bucket. It's entered once
  and edited any time.
- **This week:** the library's classes for the rest of the week. A class is
  highlighted when it fills an open gap ("Thu 6:15 · Barbell Club → your
  2nd heavy"), and dimmed if taking it would break the 48 h heavy rule.
- **"Can't make it this week":** tap a day to skip it, so the planner only
  ranks classes the user can actually get to.

### Logging

- Today → **Log a class** → pick from the library (or a one-off: name +
  bucket) → "Did you go heavy?" for heavy-eligible formats → saved.
- App sessions (home-gym heavy, impact set) log themselves on finish.

### Gap-filler (Today screen)

- A tally for the week: **Heavy 1/2 · Impact 2/3 · Studio ✓**.
- One primary suggestion, in priority order:
  1. a library class today that fills a gap;
  2. a home-gym heavy session, if Heavy is short and it's been ≥ 48 h since
     the last one;
  3. an impact set (any day, 5 min, no equipment), if Impact is short;
  4. otherwise, "You're covered this week. Enjoy any class you like."
- **Late-week squeeze:** if there aren't enough days left to fit the
  remaining heavy sessions 48 h apart, suggest one heavy plus impact. Never
  stack heavy days.

### Program content

- **Heavy session (home gym, ~40 min): the LIFTMOR four.** Back squat,
  deadlift, standing overhead press, and jumping chin-up with a drop landing,
  each in an equipment-aware variant chain (barbell → kettlebell/dumbbell →
  bodyweight) so a missing item never dead-ends the session.
- **Phases are counted in sessions, not weeks**, because the home gym is
  about once a week. **Learn the lifts** covers the first 6 home-gym sessions:
  3×8 at RPE 7, technique first. **Heavy** starts at session 7: 5×5 at RPE 8.
  That's LIFTMOR's intensity expressed as effort, because we don't test
  one-rep maxes.
- Rest during Heavy is 1.5× the learning-phase base (squat/deadlift 3:00),
  still bent by logged RPE.
- **Impact set:** 10 jumps, 30 s timer between each (the existing rest timer).
  Progression: pogo hops → countermovement jumps → step-down landings →
  multidirectional hops.
- **Cues:** plain language. Connect breath and bracing to the breath work the
  user already knows from the studio, without any pandering (same rule as
  Perennial).

### Safety

- Onboarding card (not blocking): "Get a DEXA baseline and talk to your doctor
  before starting heavy or impact work."
- A Settings toggle, "I've been told I have low bone density or have had a
  fracture from a minor fall": impact progressions cap at low-level hops, with
  "clear the next level with your doctor or a physio." The flag is stored
  locally, like everything else.
- Pain rule on every session: sharp pain stops the movement; muscular effort
  is fine.

## Data model (local, all keys `wolfram-`-prefixed)

- `wolfram-classes`: library `[{ id, name, studio, weekday, time, bucket }]`.
- Exposures reuse the `sessions` collection with `kind: 'app' | 'class' |
  'impact'`, `buckets: [...]` and optional `class_id`. That way they inherit
  localdb's transactional writes, snapshot, IDB mirror and export.
- Skip days live in the settings store (exported with prefs).

## Acceptance criteria

1. Logging a library class with "went heavy" = yes adds 1 Heavy for that week.
   The same class with "no" adds Studio only.
2. Week boundary: Sunday 11:30 pm local counts for that week; Monday
   12:05 am counts for the next. This includes a DST-change week.
3. The planner never highlights a Heavy option within 48 h of a logged Heavy.
4. Classifier: "Barbell Strength" → heavy-eligible; "Reformer Flow" →
   Studio; "Spin 45" → Cardio; "Bootcamp" → Impact + heavy-eligible.
5. Impact set: 10 jumps with a 30 s timer between them; finishing logs one
   Impact.
6. Today shows exactly one primary suggestion, following the priority order,
   and a "covered" state when all targets are met.
7. Export → import round-trips the class library, exposures and skip days.
8. Every new text colour meets ≥ 4.5:1 on `--bg` and `--bg-card`.
9. Moving a target slider updates Today's tally and the gap-filler right away.
   A target of 0 hides that bucket's goal; its tally still shows the count.
10. The 7th home-gym session is the first one prescribed at 5×5 / RPE 8.

## Test plan

- **vitest unit tests** for week bucketing (late-Sunday + DST), tally, gap
  priority, the 48 h rule and the classifier. Added to `npm run check`, so the
  pre-commit hook and CI run them.
- **Browser** (`wolfram-dev`, 375×812): add three library classes → log one as
  heavy → Today shows Heavy 1/2, and the next eligible heavy class is
  highlighted.
- **iPhone (can't run from Windows):** Home Screen install → log a class →
  force-quit → reopen → data intact.

## Store / privacy impact

None. Personal PWA, local-only; no data leaves the device.

## Decisions from Sean (2026-10-26)

1. Targets: 2 heavy ≥ 48 h apart, 3 impact, studio uncounted, **for now**.
   The user adjusts all of them with sliders (table above).
2. Home gym inventory: as listed under "Where training happens".
3. Home gym roughly once a week, so classes supply the second Heavy.
4. At home: a yoga mat; light dumbbells possibly later.
5. No injury constraints to design around.

**Onboarding therefore asks no equipment question.** The home gym is preset.
Onboarding is a short welcome, the DEXA note, and an invitation to add classes.

**Non-goal added:** a light-dumbbell home strength session. It wouldn't be
Heavy, and impact sets plus classes already cover home days.
