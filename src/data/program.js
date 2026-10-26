// The Wolfram program — three days a week, fit for life.
//
// Two short full-body strength days (A and B) and one Move day (easy cardio +
// mobility). Strength twice a week plus regular zone-2 movement is the
// best-evidenced minimum for healthspan: muscle, bone, balance, and the
// engine — without living in a gym.
//
// EQUIPMENT-AWARE SLOTS: each strength slot lists variants in preference
// order; the app picks the first one whose `needs` are covered by what the
// user said they own (Settings → Equipment, set during onboarding). The last
// variant in every chain needs nothing, so the program always resolves — a
// fully bodyweight run is a first-class version of the plan, not a fallback
// apology.

import { EX } from './exercises';

// Onboarding / Settings equipment catalog. Includes the usual home-gym
// candidates so the plan grows as the gym does — tick a new box in Settings
// the day something arrives and the slots upgrade themselves.
export const EQUIPMENT = [
  { id: 'dumbbells',  label: 'Dumbbells',            hint: 'Any pair, adjustable or fixed' },
  { id: 'kettlebell', label: 'Kettlebell',           hint: 'One is plenty' },
  { id: 'bands',      label: 'Resistance bands',     hint: 'Loop or handle style' },
  { id: 'pullup_bar', label: 'Pull-up bar',          hint: 'Doorway bar counts' },
  { id: 'bench',      label: 'Bench / sturdy step',  hint: 'A solid bottom stair works' },
  { id: 'barbell',    label: 'Barbell + plates',     hint: 'Even a light technique bar' },
  { id: 'suspension', label: 'Suspension trainer',   hint: 'TRX, rings, or similar straps' },
  { id: 'medball',    label: 'Medicine ball',        hint: 'A light one, 4–8 lbs' },
];

// Warm-up — same short list both strength days. ~4 minutes, no equipment.
// Inherited from Perennial, gentle on shoulders and lower back: thoracic
// rotation and scapular work instead of big arm swings, and every back-adjacent
// item cued to pain-free range.
export const WARMUP = [
  'Diaphragm breaths — 5 slow: inhale low and wide into the lower ribs and belt line. This breath becomes the brace',
  'March in place — 60 sec, arms swinging easy',
  'Cat-cow — 8 slow rounds, moving with the breath',
  'Open-book rotations — 5 each side, lying on your side (frees the mid-back so the low back and shoulders don’t have to)',
  'Wall slides — 8 slow, forearms on the wall, only through the arc that feels smooth',
  'Bodyweight good morning — 10, hands on hips, pain-free range only',
  'Half-kneeling hip flexor stretch — 30 sec each side (tight hip flexors nag the low back)',
];

// ── Strength day slots ──────────────────────────────────────────────────────
// slot: { role, label, variants: [exKey, ...] } — variants in preference
// order; resolution picks the first whose needs ⊆ owned equipment.

export const DAYS = {
  a: {
    id: 'a',
    name: 'Foundations A',
    blurb: 'Squat, push, pull, carry. About 30 minutes.',
    kind: 'strength',
    slots: [
      { role: 'squat',   label: 'Squat',          variants: ['goblet_squat_db', 'goblet_squat_kb', 'chair_squat'] },
      { role: 'push',    label: 'Push',           variants: ['db_floor_press', 'band_chest_press', 'incline_pushup'] },
      // TRX row leads when owned — the most lumbar-friendly row there is
      // (body supported, no hinge to hold).
      { role: 'pull',    label: 'Pull',           variants: ['trx_row', 'db_row', 'band_row', 'backpack_row'] },
      { role: 'carry',   label: 'Carry',          variants: ['suitcase_carry_db', 'suitcase_carry_kb', 'backpack_carry'] },
      { role: 'balance', label: 'Balance & core', variants: ['sl_balance_reach'] },
    ],
  },
  b: {
    id: 'b',
    name: 'Foundations B',
    blurb: 'Hinge, single leg, press, rotation. About 30 minutes.',
    kind: 'strength',
    slots: [
      // KB/DB stay ahead of the barbell on purpose: with a low-back history,
      // earn the hinge light before loading it long.
      { role: 'hinge',      label: 'Hinge',        variants: ['kb_deadlift', 'db_rdl', 'barbell_rdl', 'glute_bridge'] },
      { role: 'single_leg', label: 'Single leg',   variants: ['split_squat_db', 'step_up', 'split_squat_bw'] },
      { role: 'press',      label: 'Press',        variants: ['db_press', 'band_press', 'wall_pushup_plus'] },
      { role: 'upper_back', label: 'Upper back',   variants: ['dead_hang', 'band_pulldown', 'prone_swimmers'] },
      { role: 'rotation',   label: 'Rotation',     variants: ['kb_coil_walk', 'medball_rotation', 'band_rotation', 'hip_coil_walk'] },
    ],
  },
  move: {
    id: 'move',
    name: 'Move & Breathe',
    blurb: 'An easy 30–45 minute walk (or ride) plus five minutes of mobility.',
    kind: 'move',
    cardio: {
      key: 'zone2_walk',
      name: 'Easy walk / ride / anything',
      cue: 'Comfortable pace — you should be able to talk in full sentences the whole time. Calm nasal breathing is a perfect pace-keeper. Outside beats treadmill for the soul, but both count. Log the minutes.',
      targetMin: '30–45 min',
    },
    // Gentle by design, with shoulders and lower back leading the
    // choices: mid-back rotation and hip work do the mobilizing so the
    // touchy areas get relief without being cranked on. Nothing here should
    // ever be pushed into a pinch.
    mobility: [
      'Cat-cow — 8 slow rounds, let the spine wave through',
      'Open-book rotations — 6 each side, top knee heavy on the floor',
      'Child’s pose, walking the hands to each side — 30 sec per side (low-back decompression)',
      'Doorway chest stretch — 30 sec each side, arm low, staying WELL below any shoulder pinch',
      'One-minute single-leg balance — eyes forward, switch halfway',
    ],
  },
};

export const DAY_ORDER = ['a', 'b', 'move'];

// Weekly rhythm suggestion shown on Today (no enforcement — life happens).
export const WEEK_SHAPE = 'A · Move · B — with easy days between. Any order that fits your week is right.';

// ── Equipment resolution ────────────────────────────────────────────────────
export function resolveVariant(variants, owned) {
  const have = new Set(owned ?? []);
  for (const key of variants) {
    const needs = EX[key]?.needs ?? [];
    if (needs.every((n) => have.has(n))) return key;
  }
  return variants[variants.length - 1]; // last is always bodyweight
}

// All variants the user could run right now (for the swap picker): the ones
// their equipment allows, with the rest shown disabled by the UI if desired.
export function availableVariants(variants, owned) {
  const have = new Set(owned ?? []);
  return variants.filter((key) => (EX[key]?.needs ?? []).every((n) => have.has(n)));
}
