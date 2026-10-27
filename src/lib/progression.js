// The home-gym program over time: which phase this week is in, and what
// weight each lift should start at. Pure functions; see
// docs/specs/program-v2.md for the sources.
//
// PHASES follow STOP-EM's design (BMJ Open 2025, the one trial built for the
// menopause transition): a month learning the movements, six weeks building,
// a lighter week, then 8-week strength blocks of 5×5. They're counted in GYM
// WEEKS, calendar weeks with at least one home-gym session, so a week away
// pauses the program instead of skipping practice. Two sessions in one week
// share that week's phase, as STOP-EM's twice-weekly sessions do.
//
// LOADS follow STOP-EM's rule: add 5 % once every prescribed set is done at
// the target effort or easier. Wolfram never tests a max, so everything
// anchors on what was actually lifted last time.

import { weekKey } from './week.js';

export const FOUNDATION_WEEKS = 4;
export const BUILDING_WEEKS = 6;
export const BLOCK_WEEKS = 8;

// Gym week the next (or current) home-gym session belongs to: the distinct
// weeks with a gym session before this one, plus one.
export function gymWeekNumber(sessions, now = new Date()) {
  const thisWeek = weekKey(now);
  const before = new Set();
  for (const s of sessions ?? []) {
    if (s.kind !== 'gym') continue;
    const k = weekKey(new Date(s.performed_at));
    if (k < thisWeek) before.add(k); // "YYYY-MM-DD" compares as a date
  }
  return before.size + 1;
}

// → { phase: 'foundation' | 'building' | 'lighter' | 'strength', week, of?, block? }
export function phaseForWeek(n) {
  if (n <= FOUNDATION_WEEKS) return { phase: 'foundation', week: n, of: FOUNDATION_WEEKS };
  if (n <= FOUNDATION_WEEKS + BUILDING_WEEKS) {
    return { phase: 'building', week: n - FOUNDATION_WEEKS, of: BUILDING_WEEKS };
  }
  const first = FOUNDATION_WEEKS + BUILDING_WEEKS + 1; // week 11
  if (n === first) return { phase: 'lighter', week: n, after: 'building' };
  const k = n - first - 1;
  const block = Math.floor(k / (BLOCK_WEEKS + 1)) + 1;
  const pos = k % (BLOCK_WEEKS + 1);
  return pos < BLOCK_WEEKS
    ? { phase: 'strength', week: pos + 1, of: BLOCK_WEEKS, block }
    : { phase: 'lighter', week: n, after: 'strength' };
}

export function programPhase(sessions, now = new Date()) {
  const n = gymWeekNumber(sessions, now);
  return { gymWeek: n, ...phaseForWeek(n) };
}

// Day A / day B, alternating. A legacy v1 session ('gym') counts as B-like,
// so the first v2 session is A either way.
export function nextGymDay(sessions) {
  let last = null;
  for (const s of sessions ?? []) {
    if (s.kind !== 'gym') continue;
    if (!last || s.performed_at > last.performed_at) last = s;
  }
  return last?.day_id === 'gymA' ? 'gymB' : 'gymA';
}

// ── Starting load ───────────────────────────────────────────────────────────

export const STEP_PCT = 0.05;      // STOP-EM's increment
export const MIN_STEP = 2.5;       // one 1.25 lb plate a side
export const LIGHTER_PCT = 0.75;   // ≈ 60 % of a max when 5×5 work sits at ~80 %
export const LAYOFF_DAYS = 28;
export const LAYOFF_PCT = 0.9;
const PLATE = 2.5;
const DAY = 86400000;

const roundToPlate = (n) => Math.round(n / PLATE) * PLATE;
const step = (w) => Math.max(MIN_STEP, roundToPlate(w * STEP_PCT));

// Estimated max from a set: Epley with the reps left in reserve added back
// (RPE 8 = 2 left). Only used to translate between rep schemes.
const e1rm = (w, reps, rpe) => w * (1 + (reps + (10 - rpe)) / 30);
const weightFor = (max, reps, rpe) => max / (1 + (reps + (10 - rpe)) / 30);

const fmt = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)} lb`;

// history: newest first, [{ performedAt, sets: [{ actual_reps, actual_weight,
//   rpe, target_sets?, target_reps?, target_rpe?, phase? }] }]
// rx: today's { sets, reps, target_rpe }; phase: today's phase id.
// → { weight, reason } or null when there's nothing to go on.
export function startingLoad({ history, rx, phase, now = new Date() }) {
  const weighted = (history ?? []).filter((h) => h.sets?.some((s) => s.actual_weight > 0));
  if (!weighted.length || !rx) return null;
  // The lighter week is never the base for the next increase.
  const ref = weighted.find((h) => !h.sets.some((s) => s.phase === 'lighter')) ?? weighted[0];
  const sets = ref.sets.filter((s) => s.actual_weight > 0);

  const top = Math.max(...sets.map((s) => s.actual_weight));
  const atTop = sets.filter((s) => s.actual_weight === top);
  const first = sets[0];
  const refRx = {
    sets: first.target_sets ?? rx.sets,
    reps: first.target_reps ?? rx.reps,
    rpe: first.target_rpe ?? rx.target_rpe,
  };

  let weight;
  let reason;
  const refWasLighter = ref.sets.some((s) => s.phase === 'lighter');

  if (phase === 'lighter') {
    const base = refWasLighter ? top : top * LIGHTER_PCT;
    weight = roundToPlate(base);
    reason = `Lighter week: about three-quarters of your working weight (${fmt(top)})`;
  } else if (refRx.reps !== rx.reps || refRx.rpe !== rx.target_rpe) {
    // New rep scheme: carry the strength across through an estimated max,
    // from the hardest set at the top weight.
    const hardest = atTop.reduce((a, b) => ((b.rpe ?? 0) > (a.rpe ?? 0) ? b : a));
    const max = e1rm(top, hardest.actual_reps ?? refRx.reps, hardest.rpe ?? refRx.rpe);
    weight = roundToPlate(weightFor(max, rx.reps, rx.target_rpe));
    reason = `New sets and reps: worked out from ${fmt(top)} × ${hardest.actual_reps ?? refRx.reps} last time`;
  } else {
    const allDone = sets.length >= refRx.sets
      && sets.every((s) => (s.actual_reps ?? refRx.reps) >= refRx.reps);
    const easyEnough = sets.every((s) => (s.rpe ?? refRx.rpe) <= refRx.rpe + 0.5);
    const grind = sets.some((s) => (s.rpe ?? 0) >= refRx.rpe + 1.5)
      || sets.some((s) => (s.actual_reps ?? refRx.reps) <= refRx.reps - 2);
    if (grind) {
      weight = top - step(top);
      reason = `Last time was a grind, so ${fmt(step(top))} lighter`;
    } else if (allDone && easyEnough) {
      weight = top + step(top);
      reason = `Every set was RPE ${refRx.rpe + 0.5} or easier last time: +${fmt(step(top))}`;
    } else {
      weight = top;
      reason = `Same as last time. It goes up once every set feels like RPE ${refRx.rpe + 0.5} or easier`;
    }
  }

  const days = (new Date(now) - new Date(ref.performedAt)) / DAY;
  if (days > LAYOFF_DAYS) {
    weight = Math.min(weight, top) * LAYOFF_PCT;
    reason = `Back after ${Math.floor(days / 7)} weeks away: 10% lighter to start`;
  }

  weight = roundToPlate(weight);
  return weight > 0 ? { weight, reason } : null;
}
