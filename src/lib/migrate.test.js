import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSettings } from './migrate.js';
import { DEFAULT_TARGETS, TARGET_LIMITS } from './plan.js';

const opts = { preset: ['barbell', 'rack', 'bench'], targets: DEFAULT_TARGETS, impactMax: TARGET_LIMITS.impact.max };

describe('settings migration (v2 criterion 2)', () => {
  it('moves a v1 store from impact 3 to 4 and adds the bench', () => {
    const v1 = { equipment: ['barbell', 'rack'], targets: { heavy: 2, impact: 3, studio: 1, spacingHours: 48 } };
    const out = migrateSettings(v1, 1, opts);
    assert.deepEqual(out.equipment, ['barbell', 'rack', 'bench']);
    assert.deepEqual(out.targets, { heavy: 2, impact: 4, studio: 1, spacingHours: 48 });
  });

  it('keeps a chosen impact target, clamped to the new max', () => {
    assert.equal(migrateSettings({ equipment: [], targets: { ...DEFAULT_TARGETS, impact: 2 } }, 1, opts).targets.impact, 2);
    assert.equal(migrateSettings({ equipment: [], targets: { ...DEFAULT_TARGETS, impact: 12 } }, 1, opts).targets.impact, 7);
  });

  it('does not duplicate the bench, and resets a v0 store to the preset', () => {
    assert.deepEqual(migrateSettings({ equipment: ['bench'], targets: DEFAULT_TARGETS }, 1, opts).equipment, ['bench']);
    assert.deepEqual(migrateSettings({ weeklyGoal: 3 }, 0, opts).equipment, opts.preset);
  });
});
