import styles from './WorkoutScreen.module.css';
import common from '../components/Common.module.css';
import wstyles from '../components/Warmup.module.css';
import { useShallow } from 'zustand/react/shallow';
import {
  DAYS, WARMUP, PHASES, IMPACT_LEVELS, IMPACT_LEVEL_EVERY,
  JUMPS_PER_SET, MIN_JUMPS_TO_COUNT,
} from '../data/program';
import { SlotCard } from '../components/SlotCard';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useRestTimer } from '../stores/restTimerStore';
import { useSessions } from '../hooks/useSessions';
import { heavyPhase, impactLevel, lastHeavyAt, hoursSince, LEARN_SESSIONS } from '../lib/plan.js';
import { formatClock } from '../lib/rest';

export function WorkoutScreen({ onFinish }) {
  const dayId = useSessionStore((s) => s.dayId);
  const day = dayId ? DAYS[dayId] : null;

  if (!day) {
    return (
      <main className="screen">
        <div className="title-lg">Workout</div>
        <p className={styles.empty}>
          No session running. Start one from Today: the heavy session at the
          home gym, or a five-minute impact set anywhere. Your work saves as
          you go.
        </p>
      </main>
    );
  }

  return day.kind === 'impact'
    ? <ImpactSession day={day} onFinish={onFinish} />
    : <GymSession day={day} onFinish={onFinish} />;
}

// ── Home-gym heavy session ───────────────────────────────────────────────────
function GymSession({ day, onFinish }) {
  const { warmupChecked, setWarmupChecked } = useSessionStore(
    useShallow((s) => ({ warmupChecked: s.warmupChecked, setWarmupChecked: s.setWarmupChecked }))
  );
  const spacingHours = useSettingsStore((s) => s.targets.spacingHours);
  const { data } = useSessions();
  const sessions = data ?? [];

  const phase = heavyPhase(sessions);
  const p = PHASES[phase.phase];
  const heavy = phase.phase === 'heavy';
  const firstHeavy = heavy && phase.next === LEARN_SESSIONS + 1;
  const since = hoursSince(lastHeavyAt(sessions));
  const tooSoon = since != null && since < spacingHours;

  const allDone = warmupChecked.length === WARMUP.length;
  const toggleAll = () => WARMUP.forEach((_, i) => setWarmupChecked(i, !allDone));

  return (
    <main className="screen">
      <div className="overline">
        {heavy ? `${p.label} · session ${phase.next}` : `${p.label} · session ${phase.next} of ${phase.of}`}
      </div>
      <div className="title-lg">{day.name}</div>
      <p className={styles.blurb}>{day.blurb}</p>

      {tooSoon && (
        <div className={styles.spacingNote}>
          Your last heavy session was{' '}
          {since < 1 ? 'less than an hour' : `${Math.round(since)} hour${Math.round(since) === 1 ? '' : 's'}`}{' '}
          ago, and the target is {spacingHours}. If today’s an option, an impact set might
          serve you better; if this is your gym day, go a little lighter.
        </div>
      )}

      <div className={styles.bracingCard}>
        <div className={styles.bracingTitle}>{firstHeavy ? 'First heavy day' : p.label}</div>
        <p className={styles.bracingBody}>{p.blurb}</p>
        {firstHeavy && (
          <p className={styles.bracingBody}>
            Start each lift at the weight you used for eights, then go up in
            small jumps (the 1.25 lb plates are for exactly this) while each
            set still has about two reps left in it.
          </p>
        )}
      </div>

      <div className={styles.bracingCard}>
        <div className={styles.bracingTitle}>Bracing: the breath you already have</div>
        <p className={styles.bracingBody}>
          Studio work taught you to breathe into your side ribs. Keep that, and
          change one thing for lifting: instead of drawing your belly in, let
          the breath press it out gently all the way around, as if against a
          belt. Firm, not rigid.
        </p>
        <p className={styles.bracingBody}>
          {heavy
            ? 'On heavy sets, take that breath, brace, and hold it through the hardest part of the rep. Breathe out at the top, then take a fresh breath for the next one. (If you have high blood pressure, keep breathing out through the lift instead.)'
            : 'Breathe in and brace before each rep, then breathe out steadily as you stand up or press.'}
        </p>
      </div>

      <div className={styles.bracingCard}>
        <div className={styles.bracingTitle}>How hard, and how long to rest</div>
        <p className={styles.bracingBody}>
          Finish each set with about {heavy ? 'two' : 'three'} good reps still
          in you. That’s what the {heavy ? 8 : 7} in the RPE column means. If a
          set felt harder, nudge the number up; easier, nudge it down.
          You’re estimating, not measuring.
        </p>
        <p className={styles.bracingBody}>
          Every card shows its rest, and the timer starts when you tick a set
          off. {heavy ? 'Heavy sets get longer: three minutes after squats and deadlifts.' : 'More after squats and deadlifts, less after the press.'}{' '}
          Resting longer than it suggests is never the wrong call.
        </p>
      </div>

      <div className={wstyles.card}>
        <div className={wstyles.head}>
          <div className={wstyles.title}>Warm-up · about 6 min</div>
          <button
            type="button"
            className={`${wstyles.checkAll} ${allDone ? wstyles.allDone : ''}`}
            onClick={toggleAll}
          >
            {allDone ? 'All Done ✓' : 'Check All'}
          </button>
        </div>
        {WARMUP.map((text, i) => (
          <label key={i} className={wstyles.item}>
            <input
              type="checkbox"
              className={wstyles.cb}
              checked={warmupChecked.includes(i)}
              onChange={(e) => setWarmupChecked(i, e.target.checked)}
            />
            <span className={wstyles.text}>{text}</span>
          </label>
        ))}
      </div>

      {day.slots.map((slot) => (
        <SlotCard key={slot.role} slot={slot} dayId={day.id} phase={phase.phase} />
      ))}

      <GymFinishButton onFinish={onFinish} />
    </main>
  );
}

// "Finish" once anything is logged; until then it's a way out.
function GymFinishButton({ onFinish }) {
  const logged = useSessionStore((s) => s.setsBuffer.length);
  return (
    <button type="button" className={common.cta} onClick={onFinish}>
      {logged ? 'Finish Session →' : 'Cancel session'}
    </button>
  );
}

// ── Impact set: 10 jumps, 30 s apart ────────────────────────────────────────
function ImpactSession({ day, onFinish }) {
  const jumps = useSessionStore((s) => s.jumps);
  const setJumps = useSessionStore((s) => s.setJumps);
  const lowBoneDensity = useSettingsStore((s) => s.lowBoneDensity);
  const { data } = useSessions();
  const resting = useRestTimer((t) => t.visible);
  const remaining = useRestTimer((t) => t.remaining);
  const startTimer = useRestTimer((t) => t.start);

  const lvlIdx = impactLevel(data ?? [], {
    levels: IMPACT_LEVELS.length, every: IMPACT_LEVEL_EVERY, capLow: lowBoneDensity,
  });
  const level = IMPACT_LEVELS[lvlIdx];
  const done = jumps >= JUMPS_PER_SET;

  const jump = () => {
    const next = jumps + 1;
    setJumps(next);
    // Rest between jumps, not after the last one.
    if (next < JUMPS_PER_SET) startTimer({ exerciseName: 'Next jump', role: 'jump', rpe: null, auto: false });
  };

  return (
    <main className="screen">
      <div className="overline">Level {lvlIdx + 1} of {IMPACT_LEVELS.length}</div>
      <div className="title-lg">{day.name}</div>
      <p className={styles.blurb}>{day.blurb}</p>

      <div className={styles.impactCard}>
        <div className={styles.impactLevel}>{level.name}</div>
        <p className={styles.impactCue}>{level.cue}</p>

        <div className={styles.counter} aria-live="polite">
          <span className={styles.counterNum}>{jumps}</span>
          <span className={styles.counterOf}>/ {JUMPS_PER_SET}</span>
        </div>
        <div className={styles.dots} aria-hidden>
          {Array.from({ length: JUMPS_PER_SET }, (_, i) => (
            <span key={i} className={i < jumps ? styles.dotOn : styles.dot} />
          ))}
        </div>

        {done ? (
          <p className={styles.impactDone}>Set complete. Finish to log it.</p>
        ) : (
          <button type="button" className={styles.jumpBtn} onClick={jump} disabled={resting}>
            {resting ? `Rest · ${formatClock(remaining)}` : jumps === 0 ? 'First jump done' : 'Jump done'}
          </button>
        )}
        <p className={styles.impactWhy}>
          The thirty seconds between jumps is part of the recipe: bone responds
          more to separate jolts with rest between them than to the same number
          done back to back.
        </p>
      </div>

      {lowBoneDensity && (
        <p className={styles.spacingNote}>
          You’ve set Wolfram to keep impact at the first level. Talk to your
          doctor or a physio before moving on to bigger jumps.
        </p>
      )}

      <button type="button" className={common.cta} onClick={onFinish}>
        {done ? 'Finish set →' : jumps >= MIN_JUMPS_TO_COUNT ? 'Finish early →' : jumps > 0 ? 'Stop (won’t count yet) →' : 'Cancel'}
      </button>
    </main>
  );
}
