// Rest prescription — the single source of truth for "how long between sets".
//
// The user is new to structured lifting, so rest is never left implicit. The
// suggestion is on the card before the first set, the timer runs it, and any
// adjustment says out loud why it moved. Nothing here is a secret the app
// keeps to itself.
//
// Two inputs:
//   role — what the movement asks of you. A loaded squat or hinge drains far
//          more than a balance drill, and one flat number under-rests the big
//          patterns while padding the small ones.
//   rpe  — how hard the set actually felt. Effort is the honest signal, so the
//          prescription bends to it rather than the other way round.

// Seconds, by slot role (see DAYS in data/program.js).
//
// Calibrated for THIS program, not for a powerlifter: two sets per exercise at
// a target of three reps in the tank, five slots, half an hour door to door.
// The bases stay modest so that even the longest adjusted rest (3:00, after a
// genuinely hard squat) doesn't turn the session into an hour.
const BASE_BY_ROLE = {
  squat: 120,
  hinge: 120,        // the two that load the whole body — and the lower back
  single_leg: 90,
  press: 90,
  push: 90,
  pull: 90,
  upper_back: 90,
  carry: 90,         // grip and trunk recover faster than legs
  rotation: 60,
  balance: 60,       // skill work; long rests just make it a longer workout
};

// Fallback when a block has no role (core work, the easy day).
const BASE_BY_CONTEXT = { strength: 90, core: 60, move: 60 };

// What the set tables start on: "about three good reps still in you".
export const TARGET_RPE = 7;

const MIN_REST = 45;
const MAX_REST = 240;

// Effort bands. Coarse on purpose — the user is estimating, not measuring, and
// finer bands would imply a precision the input doesn't have.
const BANDS = [
  {
    max: 6,
    factor: 0.75,
    why: 'That one felt easy, so a shorter rest is plenty.',
  },
  {
    max: 7.5,
    factor: 1,
    why: 'Right in the range this is meant to feel.',
  },
  {
    max: 8.5,
    factor: 1.25,
    why: 'That was hard — the extra time protects your form on the next set.',
  },
  {
    max: 10,
    factor: 1.5,
    why: 'Very hard. Take the whole rest, and consider a little less weight next set.',
  },
];

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function baseRest({ role, context = 'strength' } = {}) {
  return BASE_BY_ROLE[role] ?? BASE_BY_CONTEXT[context] ?? 120;
}

// → { seconds, base, delta, adjusted, why }
// Call with rpe: null before a set is logged to get the plain suggestion.
export function restFor({ role, context = 'strength', rpe = null } = {}) {
  const base = baseRest({ role, context });
  if (rpe == null) return { seconds: base, base, delta: 0, adjusted: false, why: null };

  const band = BANDS.find((b) => rpe <= b.max) ?? BANDS[BANDS.length - 1];
  // Round to a quarter-minute so the number reads like something a person
  // would actually say out loud.
  const seconds = clamp(Math.round((base * band.factor) / 15) * 15, MIN_REST, MAX_REST);

  return { seconds, base, delta: seconds - base, adjusted: seconds !== base, why: band.why };
}

// Prose form: 150 → "2:30", 45 → "45 sec"
export function formatRest(sec) {
  if (sec < 60) return `${sec} sec`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Compact form for the countdown ring, where "45 sec" would not fit: a bare
// number under a minute, mm:ss above it. Counting down from "150" reads as
// nonsense when the rest is two and a half minutes.
export function formatClock(sec) {
  if (sec < 60) return String(sec);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// Plain-language gloss for each point on the RPE selector. The number alone
// means nothing to someone who hasn't been taught the scale.
export const RPE_MEANING = {
  6: '4 or more reps left',
  6.5: '3–4 reps left',
  7: 'about 3 reps left',
  7.5: '2–3 reps left',
  8: 'about 2 reps left',
  8.5: '1–2 reps left',
  9: 'about 1 rep left',
  9.5: 'maybe one more',
  10: 'nothing left',
};
