// The weekly loading plan: what this week has delivered, what's missing, which
// of the user's classes would fill it, and the one thing to do today.
//
// Every logged session row carries `buckets` (stamped at save time):
// 'heavy' | 'impact' | 'studio' | 'cardio'. `kind` says where it came from:
// 'gym' (the home-gym heavy session), 'impact' (a jump set), 'class'.

import { weekStart, weekEnd, weekdayIndex, dateInWeek } from './week.js';
import { FORMATS } from './classify.js';

export const DEFAULT_TARGETS = { heavy: 2, impact: 3, studio: 0, spacingHours: 48 };

// Slider ranges (Settings). Impact tops out at 14: Tucker 2015's dose was one
// set twice a day.
export const TARGET_LIMITS = {
  heavy: { min: 0, max: 4, step: 1 },
  impact: { min: 0, max: 14, step: 1 },
  studio: { min: 0, max: 7, step: 1 },
  spacingHours: { min: 24, max: 72, step: 12 },
};

// Home-gym sessions spent learning the lifts (3×8) before heavy work (5×5).
// Counted in sessions, not weeks: the home gym is about once a week.
export const LEARN_SESSIONS = 6;

const HOUR = 3600 * 1000;

export function weekTally(sessions, now = new Date()) {
  const start = weekStart(now);
  const end = weekEnd(now);
  const t = { heavy: 0, impact: 0, studio: 0, cardio: 0 };
  for (const s of sessions ?? []) {
    const at = new Date(s.performed_at);
    if (at < start || at >= end) continue;
    for (const b of s.buckets ?? []) if (b in t) t[b] += 1;
  }
  return t;
}

// Across all time, not just this week: a heavy Sunday still spaces Monday.
export function lastHeavyAt(sessions) {
  let last = null;
  for (const s of sessions ?? []) {
    if (!(s.buckets ?? []).includes('heavy')) continue;
    const at = new Date(s.performed_at);
    if (!last || at > last) last = at;
  }
  return last;
}

export function heavyAllowedAt(at, lastHeavy, spacingHours) {
  if (!lastHeavy) return true;
  return new Date(at) - lastHeavy >= spacingHours * HOUR;
}

export function hoursSince(at, now = new Date()) {
  return at ? (now - at) / HOUR : null;
}

export function gapsFor(tally, targets) {
  return {
    heavy: Math.max(0, (targets.heavy ?? 0) - tally.heavy),
    impact: Math.max(0, (targets.impact ?? 0) - tally.impact),
    studio: Math.max(0, (targets.studio ?? 0) - tally.studio),
  };
}

// The rest of this week's library classes, in time order, each marked with
// what it would fill. Greedy on purpose: the earliest class that can fill a
// gap gets it, so two back-to-back lifting classes don't both claim the last
// heavy slot, and the second one shows as too soon rather than as a plan.
//
// skipDays: weekday indexes (0 = Mon) the user can't make this week.
export function planWeek({ library = [], sessions = [], targets = DEFAULT_TARGETS, now = new Date(), skipDays = [] }) {
  const tally = weekTally(sessions, now);
  const gap = gapsFor(tally, targets);
  const left = { ...gap };
  let lastHeavy = lastHeavyAt(sessions);

  const occurrences = library
    .map((cls) => ({ cls, at: dateInWeek(now, cls.weekday, cls.time) }))
    .filter((o) => o.at >= now)
    .sort((a, b) => a.at - b.at)
    .map((o) => {
      const skipped = skipDays.includes(weekdayIndex(o.at));
      const fills = [];
      let tooSoon = false;
      if (!skipped) {
        if (FORMATS[o.cls.format]?.heavyEligible && left.heavy > 0) {
          if (heavyAllowedAt(o.at, lastHeavy, targets.spacingHours)) {
            fills.push('heavy');
            left.heavy -= 1;
            lastHeavy = o.at;
          } else {
            tooSoon = true;
          }
        }
        if (o.cls.format === 'impact' && left.impact > 0) { fills.push('impact'); left.impact -= 1; }
        if (o.cls.format === 'studio' && left.studio > 0) { fills.push('studio'); left.studio -= 1; }
      }
      return { ...o, skipped, fills, tooSoon: tooSoon && fills.length === 0 };
    });

  return { tally, gap, uncovered: left, occurrences, lastHeavy: lastHeavyAt(sessions) };
}

// The single primary suggestion for today. Classes come first: they're what
// the user enjoys, and the app's job is to make them count.
//   { type: 'class', occurrence } | { type: 'gym' } | { type: 'impact' }
//   | { type: 'studio' } | { type: 'onTrack' } | { type: 'covered' }
export function suggestToday(args) {
  const now = args.now ?? new Date();
  const targets = args.targets ?? DEFAULT_TARGETS;
  const plan = planWeek({ ...args, now, targets });
  const today = weekdayIndex(now);

  const todayClass = plan.occurrences.find((o) => weekdayIndex(o.at) === today && o.fills.length > 0);
  if (todayClass) return { type: 'class', occurrence: todayClass, plan };

  if (plan.uncovered.heavy > 0 && heavyAllowedAt(now, plan.lastHeavy, targets.spacingHours)) {
    return { type: 'gym', plan };
  }
  if (plan.uncovered.impact > 0) return { type: 'impact', plan };
  if (plan.uncovered.studio > 0) return { type: 'studio', plan };

  const anyGap = plan.gap.heavy + plan.gap.impact + plan.gap.studio > 0;
  return { type: anyGap ? 'onTrack' : 'covered', plan };
}

// Where the home-gym heavy session is in its progression.
export function heavyPhase(sessions) {
  const done = (sessions ?? []).filter((s) => s.kind === 'gym').length;
  const next = done + 1;
  return next <= LEARN_SESSIONS
    ? { phase: 'learn', next, of: LEARN_SESSIONS }
    : { phase: 'heavy', next };
}

// Impact progression: a new level every `every` completed sets, capped at the
// last level, or pinned to the first when the low-bone-density setting is on.
export function impactLevel(sessions, { levels, every = 6, capLow = false }) {
  if (capLow) return 0;
  const done = (sessions ?? []).filter((s) => s.kind === 'impact').length;
  return Math.min(levels - 1, Math.floor(done / every));
}
