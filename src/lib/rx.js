// Prescription helpers — Wolfram keeps this deliberately simple.
//
// No percentages, no periodization math. Loads are seeded from your own last
// session (see SetTable + setAdjust). Rest lives in lib/rest.js — it moved out
// of here when it grew a per-movement baseline and had to be shown on the card
// as well as run by the timer.

// SetTable compat: Wolfram has no %1RM math — recommendations come purely
// from your own logged history (seedBaseRec handles that). Returning 0 here
// means "no calculated load", which the seeding path treats as absent.
export function calcLoad() {
  return 0;
}

// Session rows carry a phase field in the original schema; Wolfram has a
// single steady phase.
export function getPhase() {
  return 'steady';
}
