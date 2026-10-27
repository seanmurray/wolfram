// Display words for buckets and plan states. Kept apart from lib/plan.js so
// the tested logic stays free of copy.

import { PHASES } from '../data/program';

export const BUCKET_LABEL = { heavy: 'Heavy', impact: 'Impact', studio: 'Studio', cardio: 'Cardio' };

// fills: ['heavy'] | ['heavy','impact'] | ['impact'] | ['studio']
export function fillsText(fills) {
  if (fills.includes('heavy') && fills.includes('impact')) return 'Counts as heavy + impact if you go heavy';
  if (fills.includes('heavy')) return 'Counts as a heavy session if you go heavy';
  if (fills.includes('impact')) return 'Counts as an impact session';
  if (fills.includes('studio')) return 'Counts toward your studio goal';
  return '';
}

export function ordinal(n) {
  return n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third' : n === 4 ? 'fourth' : `#${n}`;
}

// "Strength · block 1, week 3 of 8", from lib/progression's programPhase.
export function phaseLine(ph) {
  const p = PHASES[ph.phase];
  if (ph.phase === 'strength') return `${p.label} · block ${ph.block}, week ${ph.week} of ${ph.of}`;
  if (ph.phase === 'lighter') return p.label;
  return `${p.label} · gym week ${ph.week} of ${ph.of}`;
}
