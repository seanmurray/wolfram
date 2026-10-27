import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  weekTally, planWeek, suggestToday, impactLevel, dropLevel, availabilityOf,
  DEFAULT_TARGETS, TARGET_LIMITS,
} from './plan.js';
import { weekdayIndex } from './week.js';

const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const row = (date, buckets, kind = 'class') => ({ performed_at: date.toISOString(), buckets, kind });
// Library entry; weekday is 0 = Mon … 6 = Sun
const cls = (id, weekday, time, format) => ({ id, name: id, weekday, time, format });

// Week of Mon Oct 26 – Sun Nov 1 2026
const MON = at(2026, 10, 26, 8, 0);

describe('weekTally', () => {
  it('counts a heavy class as Heavy and a not-heavy one as Studio (criterion 1)', () => {
    const t = weekTally([row(at(2026, 10, 26, 18), ['heavy']), row(at(2026, 10, 27, 18), ['studio'])], at(2026, 10, 28));
    assert.deepEqual(t, { heavy: 1, impact: 0, studio: 1, cardio: 0 });
  });

  it('counts Sunday 11:30 pm this week and leaves Monday 12:05 am for the next (criterion 2)', () => {
    const sessions = [row(at(2026, 11, 1, 23, 30), ['impact']), row(at(2026, 11, 2, 0, 5), ['impact'])];
    assert.equal(weekTally(sessions, at(2026, 11, 1, 23, 45)).impact, 1);
    assert.equal(weekTally(sessions, at(2026, 11, 2, 9)).impact, 1);
  });

  it('ignores last week', () => {
    assert.equal(weekTally([row(at(2026, 10, 25, 10), ['heavy'])], MON).heavy, 0);
  });
});

describe('planWeek', () => {
  it('never fills Heavy within the spacing window (criterion 3)', () => {
    const sessions = [row(at(2026, 10, 26, 18), ['heavy'])]; // Mon 6 pm
    const library = [cls('tue', 1, '18:00', 'lifting'), cls('wed', 2, '19:00', 'lifting')];
    const { occurrences } = planWeek({ library, sessions, now: at(2026, 10, 26, 20) });
    assert.deepEqual(occurrences.map((o) => [o.cls.id, o.fills, o.tooSoon]), [
      ['tue', [], true],         // 24 h later: too soon
      ['wed', ['heavy'], false], // 49 h later: fills
    ]);
  });

  it('spaces across the week boundary (a heavy Sunday still blocks Monday)', () => {
    const sessions = [row(at(2026, 10, 25, 20), ['heavy'])]; // previous Sunday
    const { occurrences } = planWeek({ library: [cls('mon', 0, '10:00', 'lifting')], sessions, now: MON });
    assert.deepEqual([occurrences[0].fills, occurrences[0].tooSoon], [[], true]);
  });

  it('assigns greedily: the earliest class takes the last heavy slot', () => {
    const sessions = [row(at(2026, 10, 26, 7), ['heavy'])];
    const library = [cls('thu', 3, '18:00', 'lifting'), cls('sat', 5, '09:00', 'lifting')];
    const { occurrences, uncovered } = planWeek({ library, sessions, now: MON });
    assert.deepEqual(occurrences.map((o) => o.fills), [['heavy'], []]);
    assert.equal(occurrences[1].tooSoon, false); // not blocked; simply not needed
    assert.equal(uncovered.heavy, 0);
  });

  it('lets an impact class fill both Impact and Heavy', () => {
    const { occurrences } = planWeek({ library: [cls('boot', 2, '06:00', 'impact')], now: MON });
    assert.deepEqual(occurrences[0].fills, ['heavy', 'impact']);
  });

  it('skips days the user can’t make, and drops classes already past', () => {
    const library = [cls('mon-early', 0, '06:00', 'lifting'), cls('tue', 1, '18:00', 'lifting'), cls('thu', 3, '18:00', 'lifting')];
    const { occurrences } = planWeek({ library, now: MON, skipDays: [1] });
    assert.deepEqual(occurrences.map((o) => [o.cls.id, o.skipped, o.fills]), [
      ['tue', true, []],
      ['thu', false, ['heavy']],
    ]);
  });
});

describe('suggestToday (criterion 6: one suggestion, in priority order)', () => {
  it('1 · prefers a class later today that fills a gap', () => {
    const s = suggestToday({ library: [cls('mon', 0, '18:00', 'lifting')], now: MON });
    assert.equal(s.type, 'class');
    assert.equal(s.occurrence.cls.id, 'mon');
  });

  it('2 · suggests the home gym when Heavy is short and no class covers it', () => {
    assert.equal(suggestToday({ now: MON }).type, 'gym');
  });

  it('skips the gym when this week’s classes already cover Heavy', () => {
    const library = [cls('tue', 1, '18:00', 'lifting'), cls('thu', 3, '18:00', 'lifting')];
    assert.equal(suggestToday({ library, now: MON }).type, 'impact');
  });

  it('skips the gym inside the spacing window', () => {
    const sessions = [row(at(2026, 10, 25, 20), ['heavy'])];
    assert.equal(suggestToday({ sessions, now: MON }).type, 'impact');
  });

  it('3 · then impact, 4 · then studio when a studio target is set', () => {
    const done = [row(at(2026, 10, 26, 7), ['heavy']), row(at(2026, 10, 28, 7), ['heavy']),
      ...Array.from({ length: DEFAULT_TARGETS.impact }, () => row(at(2026, 10, 26, 7, 30), ['impact']))];
    const now = at(2026, 10, 29, 8);
    assert.equal(suggestToday({ sessions: done, now, targets: { ...DEFAULT_TARGETS, studio: 1 } }).type, 'studio');
    assert.equal(suggestToday({ sessions: done, now }).type, 'covered');
  });

  it('says on-track when gaps remain but booked classes cover them', () => {
    const done = [row(at(2026, 10, 26, 7), ['heavy']), ...Array.from({ length: DEFAULT_TARGETS.impact }, () => row(at(2026, 10, 26, 7, 30), ['impact']))];
    const s = suggestToday({ sessions: done, library: [cls('fri', 4, '18:00', 'lifting')], now: at(2026, 10, 28, 8) });
    assert.equal(s.type, 'onTrack');
  });

  it('respects a target of 0 but still tallies the bucket (criterion 9)', () => {
    const targets = { ...DEFAULT_TARGETS, heavy: 0, impact: 0 };
    const sessions = [row(at(2026, 10, 26, 7), ['heavy'])];
    const s = suggestToday({ sessions, targets, now: at(2026, 10, 27, 8) });
    assert.equal(s.type, 'covered');
    assert.equal(s.plan.tally.heavy, 1);
  });
});

describe('progressions', () => {
  const gym = (n) => Array.from({ length: n }, (_, i) => row(at(2026, 9, 1 + i), ['heavy'], 'gym'));

  it('defaults impact to 4 a week, at most one a day (v2 criterion 2)', () => {
    assert.equal(DEFAULT_TARGETS.impact, 4);
    assert.equal(TARGET_LIMITS.impact.max, 7);
  });

  it('levels impact up every eight credited sessions, caps at the top, pins low when asked', () => {
    const sets = (n, buckets = ['impact']) => Array.from({ length: n }, () => row(MON, buckets, 'impact'));
    assert.equal(impactLevel(sets(7), { levels: 4 }), 0);
    assert.equal(impactLevel(sets(8), { levels: 4 }), 1);
    assert.equal(impactLevel(sets(100), { levels: 4 }), 3);
    assert.equal(impactLevel(sets(100), { levels: 4, capLow: true }), 0);
    // Sessions stopped short (no credit) don't move the level
    assert.equal(impactLevel([...sets(7), ...sets(5, [])], { levels: 4 }), 0);
  });

  it('raises the drop-landing height every six gym sessions, not classes', () => {
    assert.equal(dropLevel(gym(5), { levels: 3 }), 0);
    assert.equal(dropLevel(gym(6), { levels: 3 }), 1);
    assert.equal(dropLevel(gym(40), { levels: 3 }), 2);
    const classes = Array.from({ length: 10 }, () => row(MON, ['heavy'], 'class'));
    assert.equal(dropLevel(classes, { levels: 3 }), 0);
  });
});

describe('availability', () => {
  // Mon + Tue evenings usual, weekday daytime sometimes, alternating weekends
  // with the weekend of Oct 31–Nov 1 off (so the week of Nov 2 is free).
  const AV = { evenings: [0, 1], daytime: 'sometimes', weekends: 'alternate', freeWeekendOf: '2026-11-02' };
  const lvl = (d) => availabilityOf(d, AV);

  it('reads usual evenings, daytime, and other evenings', () => {
    assert.deepEqual(lvl(at(2026, 10, 26, 18, 30)), { level: 'usual', reason: null });     // Mon evening
    assert.deepEqual(lvl(at(2026, 10, 27, 17, 0)), { level: 'usual', reason: null });      // Tue 5 pm sharp
    assert.deepEqual(lvl(at(2026, 10, 28, 18, 30)), { level: 'no', reason: 'outside' });  // Wed evening
    assert.deepEqual(lvl(at(2026, 10, 29, 12, 0)), { level: 'sometimes', reason: null }); // Thu lunch
  });

  it('alternates weekends from the anchor, across the DST change', () => {
    assert.deepEqual(lvl(at(2026, 10, 31, 10)), { level: 'no', reason: 'offWeekend' }); // Sat, off
    assert.deepEqual(lvl(at(2026, 11, 1, 10)), { level: 'no', reason: 'offWeekend' });  // Sun (DST ends 2 am)
    assert.equal(lvl(at(2026, 11, 7, 10)).level, 'usual');                                // next Sat, free
    assert.equal(lvl(at(2026, 11, 14, 10)).level, 'no');
    assert.equal(lvl(at(2026, 10, 24, 10)).level, 'usual');                               // the Sat before
  });

  it('treats an unanswered alternating schedule as sometimes', () => {
    assert.equal(availabilityOf(at(2026, 10, 31, 10), { ...AV, freeWeekendOf: null }).level, 'sometimes');
  });

  it('plans usual times before sometimes times, even when the sometimes one is earlier', () => {
    const library = [cls('tue-lunch', 1, '12:00', 'lifting'), cls('tue-eve', 1, '18:30', 'lifting')];
    const { occurrences } = planWeek({ library, availability: AV, targets: { ...DEFAULT_TARGETS, heavy: 1 }, now: MON });
    assert.deepEqual(occurrences.map((o) => [o.cls.id, o.level, o.fills]), [
      ['tue-lunch', 'sometimes', []],
      ['tue-eve', 'usual', ['heavy']],
    ]);
  });

  it('keeps spacing against a LATER planned heavy (two-pass)', () => {
    const library = [cls('mon-lunch', 0, '12:00', 'lifting'), cls('tue-eve', 1, '18:30', 'lifting')];
    const { occurrences, uncovered } = planWeek({ library, availability: AV, now: MON });
    assert.deepEqual(occurrences.map((o) => [o.cls.id, o.fills, o.tooSoon]), [
      ['mon-lunch', [], true],     // 30.5 h before Tuesday's planned heavy
      ['tue-eve', ['heavy'], false],
    ]);
    assert.equal(uncovered.heavy, 1);
  });

  it('never fills from an unavailable evening or an off weekend', () => {
    const library = [cls('wed-eve', 2, '18:30', 'lifting'), cls('sat', 5, '09:00', 'lifting')];
    const { occurrences } = planWeek({ library, availability: AV, now: MON });
    assert.deepEqual(occurrences.map((o) => [o.cls.id, o.reason, o.fills]), [
      ['wed-eve', 'outside', []],
      ['sat', 'offWeekend', []],
    ]);
  });

  it('honours this week’s overrides: "I can go" and "can’t go"', () => {
    const library = [cls('wed-eve', 2, '18:30', 'lifting'), cls('tue-eve', 1, '18:30', 'lifting')];
    const { occurrences } = planWeek({ library, availability: AV, now: MON, overrides: { 2: 'go', 1: 'skip' } });
    assert.deepEqual(occurrences.map((o) => [o.cls.id, o.level, o.fills]), [
      ['tue-eve', 'no', []],
      ['wed-eve', 'usual', ['heavy']],
    ]);
  });
});

describe('open windows (where a heavy class would fit)', () => {
  const AV = { evenings: [0, 1], daytime: 'sometimes', weekends: 'alternate', freeWeekendOf: '2026-11-02' };
  const days = (w) => w.map((x) => [weekdayIndex(x.at), x.part]);

  it('lists usual evenings left this week; skips daytime and the off weekend', () => {
    const { windows } = planWeek({ availability: AV, now: MON });
    assert.deepEqual(days(windows), [[0, 'evening'], [1, 'evening']]);
  });

  it('drops days with a planned class and windows too close to it', () => {
    const { windows } = planWeek({ library: [cls('tue-eve', 1, '18:30', 'lifting')], availability: AV, now: MON });
    assert.deepEqual(windows, []); // Monday 6 pm is only 24.5 h before Tuesday’s class
  });

  it('drops tonight once the evening has started, and shows free weekends', () => {
    const { windows } = planWeek({ availability: AV, now: at(2026, 11, 2, 19) }); // Mon of a free weekend
    assert.deepEqual(days(windows), [[1, 'evening'], [5, 'weekend'], [6, 'weekend']]);
  });

  it('shows nothing once Heavy is covered, or without a schedule', () => {
    const done = [row(at(2026, 10, 19, 7), ['heavy']), row(at(2026, 10, 26, 7), ['heavy']), row(at(2026, 10, 26, 7, 30), ['heavy'])];
    assert.deepEqual(planWeek({ availability: AV, sessions: done, now: MON }).windows, []);
    assert.deepEqual(planWeek({ now: MON }).windows, []);
  });
});
