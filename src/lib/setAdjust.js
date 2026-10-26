// Intra-session set adjustment logic.
//
// MENTAL MODEL — the most recent completed set is the strongest signal we
// have for the next one. baseRec (your max × phase%) is only the FIRST set's
// starting suggestion. From set 2 onward, anchor on what the user actually
// just lifted and adjust from there.
//
// Why: if your max is stale (or feeling-it-out tells you today's true 1RM is
// 30 lbs above what we have on file), pinning every set's rec to baseRec is
// gaslighting. Anchor where the user is, adjust based on how it felt.
//
// RULES — distilled from user directives + standard RPE-based programming
// references (Helms, Bromley, RP):
//
//   First set:
//     rec = baseRec (or null if no max set)
//
//   Subsequent sets:
//     anchor = lastSet.weight
//     rec    = anchor + driftForLastSet
//
//   driftForLastSet decision tree:
//     repDelta ≥ +3   →  big bump   (way too light)        e.g. asked 4, did 8+
//     repDelta = +2   →  medium bump
//     repDelta ≤ -2   →  big drop   (way too heavy)        e.g. asked 4, did 2
//     repDelta = -1 AND rpe high (≥target+0.5)
//                     →  small drop (missed at edge)
//     |repDelta| ≤ 1  →  use rpe signal:
//                     →  |Δrpe| ≤ 0.5  → stay (hit target = HIT, not undershoot)
//                     →  Δrpe > +0.5    → small drop
//                     →  Δrpe < -0.5    → small bump
//
//   Gentle gravity toward baseRec:
//     If the resulting rec drifts far from baseRec (>30 lbs), pull 15% of
//     the excess back toward baseRec. Catches stale maxes — if every set
//     keeps pulling above base, the user gets a hint without being fought.
//
//   All output rounded to 2.5 lb plates.

const PLATE = 2.5;
const GRAVITY_FROM = 30;   // start gentle pull-back when this far from baseRec
const GRAVITY_PCT  = 0.15; // pull-back proportion of the excess distance

const roundToPlate = (n) => Math.round(n / PLATE) * PLATE;

// Drift in lbs to apply to the anchor, based on one set's actual vs target.
function driftForSet({ targetReps, targetRpe, actualReps, actualWeight, actualRpe }) {
  // If user marked done without entering reps, assume prescribed.
  const reps = actualReps ?? targetReps;
  const rpe = actualRpe ?? targetRpe;
  const w = actualWeight ?? 0;

  const repDelta = reps - targetReps;

  // Bumps scale slightly with absolute weight so 1RM-style work moves in
  // bigger plates than accessory work.
  const lightBump = Math.max(5,   w * 0.05);
  const heavyDrop = Math.max(7.5, w * 0.07);

  if (repDelta >= 3) {
    return { drift:  roundToPlate(lightBump * 1.5), why: `${reps} reps vs ${targetReps} target — too light` };
  }
  if (repDelta === 2) {
    return { drift:  roundToPlate(lightBump),       why: `${reps} reps vs ${targetReps} target — slightly light` };
  }
  if (repDelta <= -2) {
    return { drift: -roundToPlate(heavyDrop),       why: `${reps} reps vs ${targetReps} target — too heavy` };
  }
  if (repDelta === -1 && rpe >= targetRpe + 0.5) {
    return { drift: -roundToPlate(heavyDrop * 0.6), why: `Missed 1 rep at RPE ${rpe} — easing back` };
  }

  // Rep count looks fine — read RPE for finer signal.
  const rpeDelta = rpe - targetRpe;
  if (Math.abs(rpeDelta) <= 0.5) {
    return { drift: 0, why: null };
  }
  if (rpeDelta > 0) {
    return { drift: -roundToPlate(rpeDelta * 5), why: `RPE ${rpe} vs target ${targetRpe} — easing` };
  }
  return { drift: roundToPlate(Math.abs(rpeDelta) * 3), why: `RPE ${rpe} vs target ${targetRpe} — small bump` };
}

// Session-to-session carryover.
//
// The intra-session engine resets every session: set 1 = max × phase% ×
// mode (calcRec), discarding what you actually lifted last time. Classic
// APRE's distinguishing feature is exactly that carryover. This closes the
// loop: nudge THIS session's starting weight by how the last session's top
// working set actually went, relative to its rep/RPE target.
//
// We apply the drift to calcRec (this week's correct intensity), NOT to
// last week's absolute weight — phase%/mode differ week to week, so calcRec
// stays the source of truth for intensity; the prior session only corrects
// for a stale stored max. Bounded to ±SEED_CAP_PCT so one anomalous session
// (a grinder, a sandbagged set) can't run the recommendation away.
const SEED_CAP_PCT = 0.12;

export function seedBaseRec({ calcRec, prescription, lastTop }) {
  if (calcRec == null || calcRec <= 0) return calcRec;
  if (!prescription || !lastTop || lastTop.weight == null) return calcRec;

  const { drift } = driftForSet({
    targetReps: prescription.reps,
    targetRpe: prescription.target_rpe ?? 8,
    actualReps: lastTop.reps,
    actualWeight: calcRec, // scale bump/drop magnitudes to this week's load
    actualRpe: lastTop.rpe,
  });
  if (!drift) return calcRec;

  const cap = calcRec * SEED_CAP_PCT;
  const bounded = Math.max(-cap, Math.min(cap, drift));
  return roundToPlate(calcRec + bounded);
}

// Pick the top working set from a session's set list: heaviest weight, then
// most reps at that weight. Returns { weight, reps, rpe } or null.
export function topSet(sets) {
  const valid = (sets ?? []).filter((s) => s.actual_weight != null && s.actual_weight > 0);
  if (!valid.length) return null;
  const topWeight = Math.max(...valid.map((s) => s.actual_weight));
  const atTop = valid.filter((s) => s.actual_weight === topWeight);
  const best = atTop.reduce((a, b) => ((b.actual_reps ?? 0) > (a.actual_reps ?? 0) ? b : a));
  return { weight: topWeight, reps: best.actual_reps, rpe: best.rpe };
}

// Compute the next set's recommended weight given baseRec + history.
//
// Returns { rec, note }:
//   rec  — rounded recommendation (null if no anchor and no baseRec)
//   note — short reason string (null when no adjustment from anchor)
export function computeNextRec({ baseRec, prescription, history }) {
  if (!prescription) return { rec: baseRec ?? null, note: null };

  const targetReps = prescription.reps;
  const targetRpe  = prescription.target_rpe ?? 8;

  const completed = history.filter((r) => r?.done);

  // First set has no anchor — use the prescribed weight.
  if (completed.length === 0) {
    return { rec: baseRec != null ? roundToPlate(baseRec) : null, note: null };
  }

  // Anchor on the most recent completed set's actual weight.
  const last = completed[completed.length - 1];
  const anchor = last.weight ?? baseRec ?? 0;
  if (!anchor) return { rec: null, note: null };

  const { drift, why } = driftForSet({
    targetReps,
    targetRpe,
    actualReps: last.reps,
    actualWeight: anchor,
    actualRpe: last.rpe,
  });

  let next = anchor + drift;

  // Gentle gravity toward baseRec when we've drifted far. This is intentional
  // mild bias, not a hard cap — keeps a stale-max recommendation in view as
  // a hint without overriding what the user is actually doing.
  if (baseRec && Math.abs(next - baseRec) > GRAVITY_FROM) {
    const sign = Math.sign(next - baseRec);
    const excess = Math.abs(next - baseRec) - GRAVITY_FROM;
    next -= sign * excess * GRAVITY_PCT;
  }

  const rec = roundToPlate(next);
  if (rec === roundToPlate(anchor) || !why) {
    return { rec, note: null };
  }

  const sign = rec > roundToPlate(anchor) ? '+' : '−';
  const lbs = Math.abs(rec - roundToPlate(anchor));
  return { rec, note: `${why} → ${sign}${lbs} lbs vs last set` };
}
