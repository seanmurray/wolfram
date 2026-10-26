import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { weekStart, weekEnd, inSameWeek, weekdayIndex, dateInWeek, formatTime } from './week.js';

// Local-time constructor: month is 1-based here for readability.
const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

describe('test environment', () => {
  it('runs in America/Chicago, so the DST cases below are real', () => {
    assert.equal(at(2026, 10, 30).getTimezoneOffset(), 300); // CDT, before Nov 1
    assert.equal(at(2026, 11, 2).getTimezoneOffset(), 360);  // CST, after
  });
});

describe('week boundaries (Mon 00:00 → Mon 00:00, local)', () => {
  it('starts every day of a week on that Monday', () => {
    for (let d = 26; d <= 31; d++) assert.equal(weekStart(at(2026, 10, d)).getDate(), 26);
    assert.equal(weekStart(at(2026, 11, 1)).getDate(), 26); // Sunday
    assert.equal(weekStart(at(2026, 11, 2)).getDate(), 2);  // next Monday
  });

  it('counts Sunday 11:30 pm in the week and Monday 12:05 am in the next (DST-end week)', () => {
    const sundayLate = at(2026, 11, 1, 23, 30); // DST ended at 2 am this day
    const mondayEarly = at(2026, 11, 2, 0, 5);
    assert.equal(inSameWeek(sundayLate, at(2026, 10, 28)), true);
    assert.equal(inSameWeek(mondayEarly, at(2026, 10, 28)), false);
    assert.equal(inSameWeek(mondayEarly, at(2026, 11, 3)), true);
  });

  it('ends a 169-hour DST-end week at local midnight, not 11 pm', () => {
    const end = weekEnd(at(2026, 10, 28));
    assert.deepEqual([end.getMonth(), end.getDate(), end.getHours()], [10, 2, 0]);
  });

  it('handles the DST-start week (167 hours) the same way', () => {
    assert.equal(inSameWeek(at(2026, 3, 8, 23, 30), at(2026, 3, 4)), true);
    assert.equal(inSameWeek(at(2026, 3, 9, 0, 5), at(2026, 3, 4)), false);
    const start = weekStart(at(2026, 3, 9, 0, 5));
    assert.deepEqual([start.getDate(), start.getHours()], [9, 0]);
  });

  it('indexes weekdays Monday-first', () => {
    assert.equal(weekdayIndex(at(2026, 10, 26)), 0);
    assert.equal(weekdayIndex(at(2026, 11, 1)), 6);
  });

  it('places a weekday + time inside the current week', () => {
    const thu = dateInWeek(at(2026, 10, 28), 3, '18:15');
    assert.deepEqual([thu.getDate(), thu.getHours(), thu.getMinutes()], [29, 18, 15]);
    // Sunday of the DST-end week, after the change, still lands at 9:00 local
    const sun = dateInWeek(at(2026, 10, 28), 6, '09:00');
    assert.deepEqual([sun.getMonth(), sun.getDate(), sun.getHours()], [10, 1, 9]);
  });

  it('formats times the way people say them', () => {
    assert.equal(formatTime('18:15'), '6:15 pm');
    assert.equal(formatTime('06:00'), '6:00 am');
    assert.equal(formatTime('12:30'), '12:30 pm');
    assert.equal(formatTime('00:10'), '12:10 am');
  });
});
