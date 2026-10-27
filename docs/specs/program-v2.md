# Spec: program v2, the evidence-led update

**Status:** BUILT 2026-10-27 and live on the web; criteria 1–9 verified in the dev build (10: existing tokens only). Reaches the iPhone with TestFlight build 2. Approved by Sean 2026-10-27 ("build your recommended 1–9").
Supersedes the *Program content*, the impact rows of *Weekly targets*, and the
*Safety* copy in `program-and-classes.md`. Everything else there still holds.

## Why

v1 took its numbers from two trials (LIFTMOR, Tucker 2015) and filled the gaps
by judgement. v2 rebuilds the program on the position statements and on the
one trial designed for the menopause transition, and says plainly where the
evidence runs out.

**The honest caveat, also shown in the app:** no trial of heavy lifting in
the menopause transition has reported yet. STOP-EM (below) is a pilot whose
results are pending. v2 copies STOP-EM's design and follows the position
statements; the outcome evidence is from postmenopausal trials.

## Sources (all read 2026-10-27)

| Source | What it gives v2 |
|---|---|
| **STOP-EM protocol**, *BMJ Open* 2025 ([PMC11800298](https://pmc.ncbi.nlm.nih.gov/articles/PMC11800298/)): peri/early-postmenopausal, 2 sessions a week, 9 months | Foundation (1 month) → building (+5 % intensity a week for 6 weeks, then a week at 60 % 1RM / RPE 6, then 1RM testing) → three 8-week strength cycles of 5×5 at 80–85 % 1RM or RPE 8–9, **+5 % once all 5×5 are done at RPE 8–8.5**. Two alternating days (day 1: deadlift/rack pull, chest press, box squat, one-arm DB row; day 2: deadlift/rack pull, shoulder press, box squat, pull-up "banded with feet supported, progress to less supported"). Every session ends with **drop landings from a box, 3×10, rising height**, a balance/carry 3×(10 or 20 s), and core 1×(10 or 20 s). Exercise moves DXA ~0.85 % at the spine, while meta-analyses show **> 60 % relative fracture-risk reduction** |
| **UK consensus "Strong, steady and straight"**, *BJSM* 2022 ([PMC9304091](https://pmc.ncbi.nlm.nih.gov/articles/PMC9304091/)) | Moderate impact on most days, **at least 50 impacts per session (e.g. 5 sets of 10)**; quotes the Australian recommendation of **impact on 4–7 days a week, 50 jumps per session as 3–5 sets of 10–20 with 1–2 min between sets**. "Movements or exercise that involve sustained, repeated or end-range flexion should be modified or avoided"; vertebral fractures reported with loaded flexion, sit-ups and extreme-flexion yoga positions. With osteoporosis, no "very high impact exercise such as landing from height"; with vertebral or multiple low-trauma fractures, impact only up to brisk walking. Adequate calcium and vitamin D |
| **SWAN**, Greendale 2012 ([PMC3378821](https://pmc.ncbi.nlm.nih.gov/articles/PMC3378821/)) | Bone loss begins ~1 year before the final menstrual period and is fastest until 2 years after it; lumbar spine −2.46 %/yr in that window (7.38 % of a 10-year 10.6 % loss) |
| **USPSTF**, 14 Jan 2025 ([recommendation](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/osteoporosis-screening)) | Screen from 65, and postmenopausal people under 65 at increased risk. Risk factors named: menopausal status, low body weight, parental hip fracture, smoking, excess alcohol. No routine premenopausal screening |
| **The Menopause Society** 2022 HT position statement, *Menopause* 29(7):767–794 ([PubMed 35797481](https://pubmed.ncbi.nlm.nih.gov/35797481/)) | Hormone therapy "has been shown to prevent bone loss and fracture"; under 60 or within 10 years of menopause onset, with no contraindications, the benefit-risk ratio is favourable |
| Creatine, 2-year RCT in 237 postmenopausal women (Chilibeck 2023, *MSSE* 55(10):1750–60; [summary](https://www.nutraingredients.com/Article/2023/10/17/creatine-shows-no-effect-on-postmenopausal-bone-mineral-density)) | No BMD benefit → not recommended for bone |
| Protein in menopause, narrative review ([Otago](https://ourarchive.otago.ac.nz/esploro/outputs/journalArticle/The-Impact-of-Protein-in-Post-Menopausal/9926555030401891)) | Evidence thin → "protein at every meal", no numbers |

## Goals (Sean's items 1–9)

1. **Impact at the consensus dose.** One impact session = **50 jumps: 5 sets of
   10, 1 minute between sets** (~6–8 min). Weekly target default **4** (slider
   0–7: one a day at most). Impact classes and the gym's landings count.
2. **STOP-EM's ramp**, counted in **gym weeks** (calendar weeks with at least
   one home-gym session, so the ramp never outruns practice):
   - weeks 1–4 **Foundation**: 3×8 at RPE 6, technique first;
   - weeks 5–10 **Building**: 5×5 at RPE 7, +5 % a session while it stays easy;
   - week 11 **Lighter week**: 3×5 at ~¾ of the working weight (≈ STOP-EM's
     60 % 1RM, since 5×5 work sits at ~80 %);
   - then **Strength** blocks of 8 weeks at 5×5, RPE 8, each followed by a
     lighter week. *The lighter week between strength blocks is Wolfram's
     choice; STOP-EM schedules one only after building.* STOP-EM's 1RM test
     week is dropped: Wolfram never tests maxes.
3. **One rule for adding weight** (STOP-EM's): next session goes up 5 %
   (at least 2.5 lb, one 1.25 lb plate a side) when every prescribed set was
   done at RPE ≤ target + 0.5; down 5 % if a set hit target + 1.5 or missed
   2+ reps; otherwise hold. A rep-scheme change converts through an estimated
   max. Back after 4+ weeks away: 10 % lighter. *(The last two are Wolfram's
   choices.)* This also fixes the blank REC column.
4. **Two alternating gym days** (A: deadlift, box squat, bench press, one-arm
   row; B: deadlift, box squat, overhead press, feet-assisted pull-up), each
   ending with **drop landings 3×10 (box height rises every 6 gym sessions)**,
   a **carry** 3×20 s and **core** 1 set.
5. **Spine safety.** Wolfram's own core work never flexes the spine (dead
   bug, side plank: both on STOP-EM's list), whatever the setting. With the
   low-bone-density setting on: impact stays at small jumps, the gym's drop
   landings become small jumps (no landing from height), and the Classes tab
   shows which class moves to modify.
6. **Why now** (SWAN) in onboarding and Settings.
7. **Scan advice corrected** to USPSTF; set expectations that exercise barely
   moves DXA yet cuts fractures.
8. **Hormone therapy**: one paragraph, "ask your doctor", citing the
   Menopause Society.
9. **Inclusive and honest**: gender-neutral copy; the evidence base is mostly
   cisgender women, and testosterone or other hormones change the picture.
   Plus a short food note (calcium + vitamin D; protein at every meal;
   creatine not for bone).

## Non-goals

- 1RM testing, percentages, or any max on file.
- Tracking symptoms, cycles, or hormone use.
- Calculating protein, calcium or vitamin D targets.
- Box-height or carry-weight logging (sets are ticked, not weighed).

## Design notes

- `lib/progression.js` (pure, tested): `gymWeekNumber`, `programPhase`,
  `startingLoad`. Set records gain `target_sets`, `target_reps`, `target_rpe`
  and `phase`, so the rule compares a session against its own prescription
  and the lighter week is never the base for the next increase.
- Slot preferences keep their v1 ids (`gym:squat`, `gym:hinge`, `gym:press`,
  `gym:pull`), so a standing swap carries over; new slots are `gym:bench` and
  `gym:row`.
- Settings store v2: adds the bench to the home-gym preset, moves the impact
  target from the old default 3 to 4, and clamps it to 0–7.

## Acceptance criteria

1. An impact session is 5 sets of 10 with a 60 s timer between sets; 3+ sets
   earns Impact credit, fewer saves without credit, none is a cancel.
2. Fresh settings default to Impact 4/week; an existing v1 store at 3 moves
   to 4; the slider stops at 7.
3. Gym weeks: two sessions in one calendar week are one gym week; a week
   without a gym session doesn't advance the phase. Weeks 1–4 Foundation,
   5–10 Building, 11 Lighter, 12–19 Strength block 1, 20 Lighter, 21 block 2.
4. Same scheme, all 5 sets at RPE ≤ 8.5 → +5 % (min +2.5 lb), rounded to
   2.5 lb; any set at 9.5+ → −5 %; otherwise hold. Lighter week → ¾ of the
   last non-lighter top set. 29+ days since → ×0.9.
5. The REC column shows a number on set 1 whenever the exercise has history,
   with a one-line reason; the first-ever session shows none.
6. Gym days alternate A/B, starting A; "switch day" works until a set is
   logged.
7. Every gym session lists drop landings, a carry and core after the lifts;
   ticking drop-landing sets earns Impact credit for the session.
8. Low-bone-density on: impact pinned to small jumps, drop landings replaced
   by small jumps, the Classes tab shows the flexion note.
9. App copy is gender-neutral except where it says who a study enrolled;
   the Settings bone guide cites each source with a link.
10. All new text colours ≥ 4.5:1 (existing tokens only).

## Test plan

- `node:test` for `progression.js` (phases, starting load, layoff, lighter
  week, scheme change), the impact targets/levels, and the settings migration.
- Dev build at 375×812: Today → impact session (5 sets, 60 s timer), gym
  day A with finisher, REC visible on a second session, Settings bone guide.
- iPhone: needs TestFlight build 2 from the Mac (build 1 predates v2).
