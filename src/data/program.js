// The Wolfram program: what the app itself prescribes. Classes do the rest
// (see lib/plan.js for how the week is balanced around them).
//
//   gym    — the home-gym heavy session: the LIFTMOR four. It's the only place
//            heavy lifting is prescribed, because it's the only place with the
//            kit. Phased by session count: learn the lifts, then go heavy.
//   impact — a five-minute jump set, anywhere: 10 jumps, 30 s apart
//            (Tucker 2015's per-session dose), progressing through levels.
//
// EQUIPMENT-AWARE SLOTS: each slot lists variants in preference order; the app
// picks the first one whose `needs` the home-gym equipment covers. The last
// variant always needs nothing, so the session always resolves.

import { EX } from './exercises';
import { LEARN_SESSIONS } from '../lib/plan.js';

// The home gym. Preset to what's there; editable in Settings if it changes.
export const EQUIPMENT = [
  { id: 'barbell',    label: 'Barbell + plates',  hint: 'With 1.25 lb plates for small jumps' },
  { id: 'rack',       label: 'Squat rack',        hint: 'With spotter arms' },
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

// Per-phase prescription for the home-gym lifts.
export const PHASES = {
  learn: {
    label: 'Learning the lifts',
    rx: { sets: 3, reps: 8, target_rpe: 7 },
    pullRx: { sets: 3, reps: 5, target_rpe: 7 },
    blurb: `Sessions 1–${LEARN_SESSIONS}: three sets of eight with about three good reps left in you. Technique first; the weight comes later.`,
  },
  heavy: {
    label: 'Heavy',
    rx: { sets: 5, reps: 5, target_rpe: 8 },
    pullRx: { sets: 5, reps: 5, target_rpe: 8 },
    blurb: 'Five sets of five with about two reps left. This is the loading bone responds to. Add weight in small jumps whenever the last set still has two reps in it.',
  },
};

export const DAYS = {
  gym: {
    id: 'gym',
    kind: 'gym',
    name: 'Home gym · heavy',
    blurb: 'Squat, deadlift, press, and jumping chin-ups. About 40 minutes.',
    slots: [
      { role: 'squat', label: 'Squat',          variants: ['back_squat', 'goblet_squat_kb', 'goblet_squat_db', 'chair_squat'] },
      { role: 'hinge', label: 'Deadlift',       variants: ['deadlift', 'kb_deadlift', 'db_rdl', 'glute_bridge'] },
      { role: 'press', label: 'Press',          variants: ['ohp', 'db_press', 'kb_press', 'incline_pushup'] },
      { role: 'pull',  label: 'Pull + landing', variants: ['jumping_chinup', 'inverted_row', 'db_row', 'backpack_row'], pull: true },
    ],
  },
  impact: {
    id: 'impact',
    kind: 'impact',
    name: 'Impact set',
    blurb: '10 jumps, 30 seconds apart. About five minutes, anywhere.',
  },
};

export const JUMPS_PER_SET = 10;
export const JUMP_REST_SEC = 30;
// A set this short still counts; anything less is a false start.
export const MIN_JUMPS_TO_COUNT = 5;
export const IMPACT_LEVEL_EVERY = 6;

// The impact progression: a new level every IMPACT_LEVEL_EVERY completed sets.
// Strain rises by height, then by drop, then by direction (bone likes loads it
// hasn't seen before).
export const IMPACT_LEVELS = [
  {
    name: 'Small jumps',
    cue: 'Jump straight up about a hand’s height. Land softly on the balls of your feet and let your heels kiss the floor, knees bending to absorb it.',
  },
  {
    name: 'Full jumps',
    cue: 'Dip, swing your arms, and jump as high as you can. Land softly on both feet with your knees bending, quiet as you can make it.',
  },
  {
    name: 'Step-down landings',
    cue: 'Step off a low step (a bottom stair is perfect), land on both feet, absorb, then jump straight up as high as you can.',
  },
  {
    name: 'Jumps in every direction',
    cue: 'Full jumps, changing direction each time: forward, to the side, back, to the other side. Land softly and reset between each.',
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
