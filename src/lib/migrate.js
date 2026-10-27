// Settings-store migrations, kept pure (and out of the store) so they're
// tested without zustand or localStorage. The store passes in its preset and
// defaults, which live in modules Node can't import directly.
//
//   v0 → v1: Perennial-scaffold shape; reset equipment and targets.
//   v1 → v2: program v2 (docs/specs/program-v2.md). The bench joins the home
//            gym (bench press and box squat need it). Impact moves from v1's
//            default of 3 to 4, and nothing stays above the new max of 7.

export function migrateSettings(state, from, { preset, targets, impactMax }) {
  let s = state ?? {};
  if (from < 1) {
    s = { ...s, equipment: preset, targets, weeklyGoal: undefined };
  }
  if (from < 2) {
    const equipment = s.equipment ?? preset;
    const old = s.targets ?? targets;
    const impact = old.impact === 3 ? targets.impact : Math.min(impactMax, old.impact ?? targets.impact);
    s = {
      ...s,
      equipment: equipment.includes('bench') ? equipment : [...equipment, 'bench'],
      targets: { ...old, impact },
    };
  }
  return s;
}
