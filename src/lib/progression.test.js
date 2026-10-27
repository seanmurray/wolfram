import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gymWeekNumber, phaseForWeek, programPhase, nextGymDay, startingLoad } from './progression.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
const gym = (date, dayId = 'gymA') => ({ performed_at: date.toISOString(), kind: 'gym', day_id: dayId });

describe('gym weeks (v2 criterion 3)', () => {
  it('counts weeks with a home-gym session, not sessions or calendar weeks', () => {
    const sessions = [
      gym(at(2026, 10, 5)), gym(at(2026, 10, 7)),   // two in one week = one gym week
      gym(at(2026, 10, 19)),                          // the week of the 12th skipped
      { performed_at: at(2026, 10, 13).toISOString(), kind: 'class', buckets: ['heavy'] },
    ];
    assert.equal(gymWeekNumber(sessions, at(2026, 10, 27)), 3);
    // A session already this week doesn't start a new gym week
    assert.equal(gymWeekNumber([...sessions, gym(at(2026, 10, 26))], at(2026, 10, 28)), 3);
    assert.equal(gymWeekNumber([], at(2026, 10, 27)), 1);
  });

  it('maps gym weeks onto STOP-EM’s phases', () => {
    assert.equal(phaseForWeek(1).phase, 'foundation');
    assert.equal(phaseForWeek(4).phase, 'foundation');
    assert.deepEqual(phaseForWeek(5), { phase: 'building', week: 1, of: 6 });
    assert.equal(phaseForWeek(10).phase, 'building');
    assert.equal(phaseForWeek(11).phase, 'lighter');
    assert.deepEqual(phaseForWeek(12), { phase: 'strength', week: 1, of: 8, block: 1 });
    assert.deepEqual(phaseForWeek(19), { phase: 'strength', week: 8, of: 8, block: 1 });
    assert.equal(phaseForWeek(20).phase, 'lighter');
    assert.deepEqual(phaseForWeek(21), { phase: 'strength', week: 1, of: 8, block: 2 });
  });

  it('keeps week boundaries across the DST change (Sun 1 Nov 2026, America/Chicago)', () => {
    const lateSunday = new Date(2026, 10, 1, 23, 30);   // DST ended that morning
    assert.equal(gymWeekNumber([gym(lateSunday)], new Date(2026, 10, 2, 0, 5)), 2);
    assert.equal(gymWeekNumber([gym(lateSunday)], new Date(2026, 10, 1, 23, 45)), 1);
  });

  it('programPhase combines the two', () => {
    assert.equal(programPhase([], at(2026, 10, 27)).phase, 'foundation');
  });
});

describe('alternating days (v2 criterion 6)', () => {
  it('starts on A and alternates; a v1 session counts as B', () => {
    assert.equal(nextGymDay([]), 'gymA');
    assert.equal(nextGymDay([gym(at(2026, 10, 5), 'gymA')]), 'gymB');
    assert.equal(nextGymDay([gym(at(2026, 10, 5), 'gymA'), gym(at(2026, 10, 12), 'gymB')]), 'gymA');
    assert.equal(nextGymDay([gym(at(2026, 10, 5), 'gym')]), 'gymA');
  });
});

describe('starting load (v2 criteria 4, 5)', () => {
  const NOW = at(2026, 10, 27);
  const strength = { sets: 5, reps: 5, target_rpe: 8 };
  const session = (daysAgo, sets, extra = {}) => ({
    performedAt: new Date(NOW - daysAgo * 86400000).toISOString(),
    sets: sets.map(([w, reps, rpe]) => ({
      actual_weight: w, actual_reps: reps, rpe,
      target_sets: 5, target_reps: 5, target_rpe: 8, phase: 'strength', ...extra,
    })),
  });
  const five = (w, rpe, reps = 5) => Array.from({ length: 5 }, () => [w, reps, rpe]);

  it('has nothing to suggest the first time', () => {
    assert.equal(startingLoad({ history: [], rx: strength, phase: 'strength', now: NOW }), null);
  });

  it('adds 5% when every set was RPE 8.5 or easier', () => {
    const r = startingLoad({ history: [session(7, five(100, 8.5))], rx: strength, phase: 'strength', now: NOW });
    assert.equal(r.weight, 105);
    assert.match(r.reason, /\+5 lb/);
  });

  it('adds at least one 2.5 lb step on a light lift', () => {
    assert.equal(startingLoad({ history: [session(7, five(20, 7))], rx: strength, phase: 'strength', now: NOW }).weight, 22.5);
  });

  it('holds when a set was harder than 8.5 or sets are missing', () => {
    const hard = [...five(100, 8).slice(0, 4), [100, 5, 9]];
    assert.equal(startingLoad({ history: [session(7, hard)], rx: strength, phase: 'strength', now: NOW }).weight, 100);
    const short = five(100, 8).slice(0, 3);
    assert.equal(startingLoad({ history: [session(7, short)], rx: strength, phase: 'strength', now: NOW }).weight, 100);
  });

  it('drops 5% after a grind (RPE 9.5+ or two reps short)', () => {
    const grind = [...five(100, 8).slice(0, 4), [100, 5, 9.5]];
    assert.equal(startingLoad({ history: [session(7, grind)], rx: strength, phase: 'strength', now: NOW }).weight, 95);
    const missed = [...five(100, 8).slice(0, 4), [100, 3, 9]];
    assert.equal(startingLoad({ history: [session(7, missed)], rx: strength, phase: 'strength', now: NOW }).weight, 95);
  });

  it('takes about three-quarters for the lighter week, and progresses from the week before it after', () => {
    const lighterRx = { sets: 3, reps: 5, target_rpe: 6 };
    const r = startingLoad({ history: [session(7, five(100, 8))], rx: lighterRx, phase: 'lighter', now: NOW });
    assert.equal(r.weight, 75);
    const afterLighter = [
      session(7, [[75, 5, 6], [75, 5, 6], [75, 5, 6]], { target_sets: 3, target_rpe: 6, phase: 'lighter' }),
      session(14, five(100, 8)),
    ];
    assert.equal(startingLoad({ history: afterLighter, rx: strength, phase: 'strength', now: NOW }).weight, 105);
  });

  it('converts across a rep-scheme change through an estimated max', () => {
    // Foundation 3×8 at RPE 6 → building 5×5 at RPE 7: about +10 %
    const foundation = {
      performedAt: new Date(NOW - 7 * 86400000).toISOString(),
      sets: [[60, 8, 6], [60, 8, 6], [60, 8, 6.5]].map(([w, reps, rpe]) => ({
        actual_weight: w, actual_reps: reps, rpe, target_sets: 3, target_reps: 8, target_rpe: 6, phase: 'foundation',
      })),
    };
    const r = startingLoad({ history: [foundation], rx: { sets: 5, reps: 5, target_rpe: 7 }, phase: 'building', now: NOW });
    assert.equal(r.weight, 65);
    assert.match(r.reason, /New sets and reps/);
  });

  it('starts 10% lighter after four weeks away', () => {
    const r = startingLoad({ history: [session(35, five(100, 8))], rx: strength, phase: 'strength', now: NOW });
    assert.equal(r.weight, 90);
    assert.match(r.reason, /5 weeks away/);
  });

  it('treats records without targets as today’s scheme (v1 history)', () => {
    const v1 = { performedAt: new Date(NOW - 7 * 86400000).toISOString(), sets: five(80, 8).map(([w, reps, rpe]) => ({ actual_weight: w, actual_reps: reps, rpe })) };
    assert.equal(startingLoad({ history: [v1], rx: strength, phase: 'strength', now: NOW }).weight, 85);
  });
});
