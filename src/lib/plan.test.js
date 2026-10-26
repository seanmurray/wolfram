import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  weekTally, planWeek, suggestToday, heavyPhase, impactLevel,
  DEFAULT_TARGETS, LEARN_SESSIONS,
} from './plan.js';

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
      ...[1, 2, 3].map(() => row(at(2026, 10, 26, 7, 30), ['impact']))];
    const now = at(2026, 10, 29, 8);
    assert.equal(suggestToday({ sessions: done, now, targets: { ...DEFAULT_TARGETS, studio: 1 } }).type, 'studio');
    assert.equal(suggestToday({ sessions: done, now }).type, 'covered');
  });

  it('says on-track when gaps remain but booked classes cover them', () => {
    const done = [row(at(2026, 10, 26, 7), ['heavy']), ...[1, 2, 3].map(() => row(at(2026, 10, 26, 7, 30), ['impact']))];
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

  it('learns the lifts for six home-gym sessions, then goes heavy on the 7th (criterion 10)', () => {
    assert.deepEqual(heavyPhase(gym(0)), { phase: 'learn', next: 1, of: LEARN_SESSIONS });
    assert.deepEqual(heavyPhase(gym(5)), { phase: 'learn', next: 6, of: LEARN_SESSIONS });
    assert.deepEqual(heavyPhase(gym(6)), { phase: 'heavy', next: 7 });
  });

  it('only counts home-gym sessions toward the phase, not heavy classes', () => {
    const classes = Array.from({ length: 10 }, () => row(MON, ['heavy'], 'class'));
    assert.equal(heavyPhase(classes).phase, 'learn');
  });

  it('levels impact up every six sets, caps at the top, pins low when asked', () => {
    const sets = (n) => Array.from({ length: n }, () => row(MON, ['impact'], 'impact'));
    assert.equal(impactLevel(sets(5), { levels: 4 }), 0);
    assert.equal(impactLevel(sets(6), { levels: 4 }), 1);
    assert.equal(impactLevel(sets(100), { levels: 4 }), 3);
    assert.equal(impactLevel(sets(100), { levels: 4, capLow: true }), 0);
  });
});
