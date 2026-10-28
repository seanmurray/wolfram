import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyClass, bucketsFor, FORMATS } from './classify.js';

describe('classifyClass', () => {
  const cases = [
    // Spec acceptance criterion 4
    ['Barbell Strength', 'lifting'],
    ['Reformer Flow', 'studio'],
    ['Spin 45', 'cardio'],
    ['Bootcamp', 'impact'],
    // Studio words beat strength words: these are light-load classes
    ['Strength Pilates', 'studio'],
    ['Sculpt & Strength', 'studio'],
    ['Power Yoga', 'studio'],
    ['Hot Yoga 60', 'studio'],
    ['Body Pump', 'studio'],
    // Impact beats lifting, so the jumps get credit
    ['HIIT Strength', 'impact'],
    ['Boot Camp', 'impact'],
    ['Run Club', 'impact'],
    // Lifting
    ['Powerlifting Fundamentals', 'lifting'],
    ['Kettlebell Club', 'lifting'],
    ['CrossFit WOD', 'lifting'],
    ['Olympic Lifting', 'lifting'],
    // Cardio
    ['Rhythm Ride', 'cardio'],
    ['Rowing Intervals', 'cardio'],
    // Unknown names default to studio; the user confirms on add
    ['Sunday Session', 'studio'],
  ];
  for (const [name, format] of cases) {
    it(`${name} → ${format}`, () => assert.equal(classifyClass(name), format));
  }

  it('marks only lifting and impact as heavy-eligible', () => {
    assert.equal(FORMATS.lifting.heavyEligible, true);
    assert.equal(FORMATS.impact.heavyEligible, true);
    assert.equal(FORMATS.studio.heavyEligible, false);
    assert.equal(FORMATS.cardio.heavyEligible, false);
  });
});

describe('bucketsFor (what a logged class counts as)', () => {
  it('credits a lifting class as Heavy only when it went heavy (criterion 1)', () => {
    assert.deepEqual(bucketsFor('lifting', true), ['heavy']);
    assert.deepEqual(bucketsFor('lifting', false), ['studio']);
  });

  it('always credits impact, and adds Heavy when it went heavy', () => {
    assert.deepEqual(bucketsFor('impact', false), ['impact']);
    assert.deepEqual(bucketsFor('impact', true), ['impact', 'heavy']);
  });

  it('never gives cardio bone credit', () => {
    assert.deepEqual(bucketsFor('cardio', true), ['cardio']);
  });
});
