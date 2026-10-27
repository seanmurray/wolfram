// The Wolfram program: what the app itself prescribes. Classes do the rest
// (see lib/plan.js for how the week is balanced around them). Sources and
// reasoning: docs/specs/program-v2.md.
//
//   gym    — the home-gym session, STOP-EM's two alternating days (A and B),
//            each ending with drop landings, a carry, and core. It's the only
//            place the app prescribes heavy lifting, because it's the only
//            place with the kit. Phases come from lib/progression.js.
//   impact — 50 jumps as five sets of ten, a minute between sets: the dose
//            the Australian and UK position statements recommend on most days.
//
// EQUIPMENT-AWARE SLOTS: each slot lists variants in preference order; the app
// picks the first one whose `needs` the home-gym equipment covers. The last
// variant always needs nothing, so the session always resolves. Slot ids are
// what standing swaps are saved under ("gym:<id>"), shared by both days.

import { EX } from './exercises';

// The home gym. Preset to what's there; editable in Settings if it changes.
export const EQUIPMENT = [
  { id: 'barbell',    label: 'Barbell + plates',  hint: 'With 1.25 lb plates for small jumps' },
  { id: 'rack',       label: 'Squat rack',        hint: 'With spotter arms' },
  { id: 'bench',      label: 'Bench',             hint: 'Flat or adjustable' },
  { id: 'pullup_bar', label: 'Pull-up bar',       hint: 'On the rack counts' },
  { id: 'dumbbells',  label: 'Dumbbells',         hint: 'Light pairs or loadable handles' },
  { id: 'kettlebell', label: 'Kettlebells',       hint: 'Any weight' },
];
export const HOME_GYM_PRESET = EQUIPMENT.map((e) => e.id);

// ~6 minutes. The last line matters most: warm-up sets are how a heavy set
// stops being scary.
export const WARMUP = [
  'Breathing — 5 slow breaths, low and wide into the belly and side ribs. This breath is the start of every brace today',
  'Brisk march or easy bike — 3 min, just get warm',
  'Cat-cow — 6 slow rounds',
  'Goblet squat hold — 3 × 20 sec at the bottom, elbows nudging the knees out',
  'Hip hinge with the empty bar or a broomstick — 8 slow reps, feel the hamstrings load',
  'Dead hang from the bar — 2 × 15–20 sec, shoulders gently engaged',
  'Small pogo hops — 2 × 10, light and springy',
  'Before each lift: the empty bar × 5, then two lighter sets of 3. They don’t count, and they make the working sets feel familiar',
];

// Per-phase prescription for the home-gym lifts (STOP-EM's structure; the
// foundation and lighter-week numbers are Wolfram's). context picks the rest
// lengths in lib/rest.js.
export const PHASES = {
  foundation: {
    label: 'Foundation',
    rx: { sets: 3, reps: 8, target_rpe: 6 },
    pullRx: { sets: 3, reps: 5, target_rpe: 6 },
    context: 'strength',
    blurb: 'Three sets of eight, light enough to leave about four good reps in you. These first four gym weeks are for learning how each lift should feel. The weight comes later.',
  },
  building: {
    label: 'Building',
    rx: { sets: 5, reps: 5, target_rpe: 7 },
    pullRx: { sets: 5, reps: 5, target_rpe: 7 },
    context: 'heavy',
    blurb: 'Five sets of five with about three reps left in you. Each time every set feels like that or easier, the weight goes up 5% next time, so it climbs most weeks.',
  },
  lighter: {
    label: 'Lighter week',
    rx: { sets: 3, reps: 5, target_rpe: 6 },
    pullRx: { sets: 3, reps: 5, target_rpe: 6 },
    context: 'strength',
    blurb: 'About three-quarters of your usual weight, three sets of five. Recovery is when muscle and bone catch up. If you take a barbell class this week, keep that easy too.',
  },
  strength: {
    label: 'Strength',
    rx: { sets: 5, reps: 5, target_rpe: 8 },
    pullRx: { sets: 5, reps: 5, target_rpe: 8 },
    context: 'heavy',
    blurb: 'Five sets of five with about two reps left: the loading bone responds to. When every set feels like RPE 8.5 or easier, the weight goes up 5% next time.',
  },
};

const HINGE = { id: 'hinge', role: 'hinge', label: 'Deadlift',       variants: ['deadlift', 'rack_pull', 'kb_deadlift', 'db_rdl', 'glute_bridge'] };
const SQUAT = { id: 'squat', role: 'squat', label: 'Squat to a box', variants: ['box_squat', 'back_squat', 'goblet_squat_kb', 'goblet_squat_db', 'chair_squat'] };

export const DAYS = {
  gymA: {
    id: 'gymA',
    kind: 'gym',
    letter: 'A',
    name: 'Home gym · day A',
    blurb: 'Deadlift, box squat, bench press and a row, then landings, a carry and core. About 50 minutes.',
    slots: [
      HINGE,
      SQUAT,
      { id: 'bench', role: 'press', label: 'Chest press', variants: ['bench_press', 'db_bench_press', 'db_floor_press', 'incline_pushup'] },
      { id: 'row',   role: 'pull',  label: 'Row',         variants: ['db_row', 'kb_row', 'inverted_row', 'backpack_row'] },
    ],
    finisher: { carry: ['farmer_carry_kb', 'farmer_carry_db', 'tightrope_walk'], core: { key: 'dead_bug', reps: 10, unit: 'each side' } },
  },
  gymB: {
    id: 'gymB',
    kind: 'gym',
    letter: 'B',
    name: 'Home gym · day B',
    blurb: 'Deadlift, box squat, overhead press and pull-ups, then landings, a carry and core. About 50 minutes.',
    slots: [
      HINGE,
      SQUAT,
      { id: 'press', role: 'press', label: 'Overhead press', variants: ['ohp', 'db_press', 'kb_press', 'incline_pushup'] },
      { id: 'pull',  role: 'pull',  label: 'Pull-up',        variants: ['assisted_pullup', 'jumping_chinup', 'inverted_row', 'backpack_row'], pull: true },
    ],
    finisher: { carry: ['suitcase_carry_kb', 'suitcase_carry_db', 't_balance'], core: { key: 'side_plank', reps: 20, unit: 'sec each side' } },
  },
  impact: {
    id: 'impact',
    kind: 'impact',
    name: 'Impact session',
    blurb: 'Fifty jumps: five sets of ten, a minute between sets. About seven minutes, anywhere.',
  },
};

// The end of every gym session (STOP-EM): drop landings 3×10, a carry or
// balance drill 3 × 20 sec, and one set of core (reps per day, above).
// Ticked off, not weighed.
export const FINISHER = {
  landing: { sets: 3, reps: 10, unit: 'landings', role: 'landing' },
  carry:   { sets: 3, reps: 20, unit: 'sec',      role: 'carry' },
  core:    { sets: 1, role: 'core' },
};

// Drop-landing height rises every DROP_LEVEL_EVERY gym sessions ("a box
// height the participant is comfortable with", raised as the program goes).
export const DROP_LEVEL_EVERY = 6;
export const DROP_LEVELS = [
  { name: 'Low step', height: 'about 15 cm / 6 in', where: 'the bottom stair is perfect' },
  { name: 'Shin height', height: 'about 30 cm / 12 in', where: 'two stairs up, or a sturdy low box' },
  { name: 'Knee height', height: 'about 45 cm / 18 in', where: 'a sturdy box' },
];

// Impact session: five sets of ten, a minute between sets.
export const IMPACT_SETS = 5;
export const JUMPS_PER_SET = 10;
// Three sets still counts; fewer is logged without credit.
export const MIN_SETS_TO_COUNT = 3;
// Levels change every 8 sessions: two weeks at four a week.
export const IMPACT_LEVEL_EVERY = 8;

// The impact progression. Strain rises by height, then by drop, then by
// direction (bone likes loads it hasn't seen before). Small jumps are the
// "low-level jumping" the UK consensus calls moderate impact, so they're also
// where the low-bone-density setting keeps things.
export const IMPACT_LEVELS = [
  {
    name: 'Small jumps',
    cue: 'Jump straight up about a hand’s height, ten in a row. Land softly on the balls of your feet and let your heels kiss the floor, knees bending to absorb it.',
  },
  {
    name: 'Full jumps',
    cue: 'Dip, swing your arms, and jump as high as you can. Land softly on both feet with your knees bending, reset your feet, and go again. Ten per set.',
  },
  {
    name: 'Step-down landings',
    cue: 'Step off a low step (a bottom stair is perfect), land on both feet, absorb, then jump straight up as high as you can. Step back up: that’s one. Ten per set.',
  },
  {
    name: 'Jumps in every direction',
    cue: 'Full jumps, changing direction each time: forward, to the side, back, to the other side. Land softly and reset between each. Ten per set.',
  },
];

// ── Equipment resolution ────────────────────────────────────────────────────
export function resolveVariant(variants, owned) {
  const have = new Set(owned ?? []);
  for (const key of variants) {
    const needs = EX[key]?.needs ?? [];
    if (needs.every((n) => have.has(n))) return key;
  }
  return variants[variants.length - 1]; // last is always bodyweight
}

// All variants the user could run right now (for the swap picker).
export function availableVariants(variants, owned) {
  const have = new Set(owned ?? []);
  return variants.filter((key) => (EX[key]?.needs ?? []).every((n) => have.has(n)));
}
