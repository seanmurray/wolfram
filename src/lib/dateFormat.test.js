import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from './dateFormat.js';

describe('formatDate', () => {
  it('formats the full ISO timestamps localdb writes (was "Invalid Date")', () => {
    const out = formatDate('2026-10-26T17:20:54.000Z');
    assert.notEqual(out, 'Invalid Date');
    assert.match(out, /Oct/);
    assert.match(out, /26/);
  });

  it('shows the LOCAL day for a late-evening session (UTC is already tomorrow)', () => {
    // 10 pm Monday in Chicago = 03:00 Tuesday UTC
    assert.match(formatDate('2026-10-27T03:00:00.000Z'), /26/);
  });

  it('still reads date-only strings as that calendar day, not UTC midnight', () => {
    assert.match(formatDate('2026-10-26'), /26/);
  });

  it('dashes out missing values', () => {
    assert.equal(formatDate(null), '—');
    assert.equal(formatDate(''), '—');
  });
});
