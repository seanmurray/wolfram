import styles from './WorkoutScreen.module.css';
import common from '../components/Common.module.css';
import wstyles from '../components/Warmup.module.css';
import fstyles from '../components/FinisherCard.module.css';
import { useShallow } from 'zustand/react/shallow';
import {
  DAYS, WARMUP, PHASES, FINISHER, DROP_LEVELS, DROP_LEVEL_EVERY,
  IMPACT_LEVELS, IMPACT_LEVEL_EVERY, IMPACT_SETS, JUMPS_PER_SET, MIN_SETS_TO_COUNT,
  resolveVariant,
} from '../data/program';
import { SlotCard } from '../components/SlotCard';
import { FinisherCard } from '../components/FinisherCard';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useRestTimer } from '../stores/restTimerStore';
import { useSessions } from '../hooks/useSessions';
import { impactLevel, dropLevel, lastHeavyAt, hoursSince } from '../lib/plan.js';
import { programPhase } from '../lib/progression.js';
import { formatClock } from '../lib/rest';
import { phaseLine } from '../lib/labels.js';

// "about four" reps left, by target RPE (see RPE_MEANING in lib/rest.js).
const REPS_LEFT = { 6: 'four', 7: 'three', 8: 'two' };

export function WorkoutScreen({ onFinish }) {
  const dayId = useSessionStore((s) => s.dayId);
  const day = dayId ? DAYS[dayId] : null;

  if (!day) {
    return (
      <main className="screen">
        <div className="title-lg">Workout</div>
        <p className={styles.empty}>
          No session running. Start one from Today: the home-gym session, or
          an impact session anywhere. Your work saves as you go.
        </p>
      </main>
    );
  }

  return day.kind === 'impact'
    ? <ImpactSession day={day} onFinish={onFinish} />
    : <GymSession key={day.id} day={day} onFinish={onFinish} />;
}

// ── Home-gym session (day A or B) ────────────────────────────────────────────
function GymSession({ day, onFinish }) {
  const { warmupChecked, setWarmupChecked, logged, startSession } = useSessionStore(
    useShallow((s) => ({
      warmupChecked: s.warmupChecked,
      setWarmupChecked: s.setWarmupChecked,
      logged: s.setsBuffer.length,
      startSession: s.startSession,
    }))
  );
  const spacingHours = useSettingsStore((s) => s.targets.spacingHours);
  const lowBoneDensity = useSettingsStore((s) => s.lowBoneDensity);
  const equipment = useSettingsStore((s) => s.equipment);
  const { data } = useSessions();
  const sessions = data ?? [];

  const phase = programPhase(sessions);
  const p = PHASES[phase.phase];
  const heavy = p.context === 'heavy';
  const repsLeft = REPS_LEFT[p.rx.target_rpe];
  const since = hoursSince(lastHeavyAt(sessions));
  const tooSoon = since != null && since < spacingHours;
  const other = day.id === 'gymA' ? DAYS.gymB : DAYS.gymA;

  const drop = DROP_LEVELS[dropLevel(sessions, { levels: DROP_LEVELS.length, every: DROP_LEVEL_EVERY })];
  const carryKey = resolveVariant(day.finisher.carry, equipment);

  const allDone = warmupChecked.length === WARMUP.length;
  const toggleAll = () => WARMUP.forEach((_, i) => setWarmupChecked(i, !allDone));

  return (
    <main className="screen">
      <div className="overline">{phaseLine(phase)}</div>
      <div className="title-lg">{day.name}</div>
      <p className={styles.blurb}>{day.blurb}</p>
      {logged === 0 && (
        <button type="button" className={styles.switchDay} onClick={() => startSession(other.id)}>
          Switch to day {other.letter} instead
        </button>
      )}

      {tooSoon && (
        <div className={styles.spacingNote}>
          Your last heavy session was{' '}
          {since < 1 ? 'less than an hour' : `${Math.round(since)} hour${Math.round(since) === 1 ? '' : 's'}`}{' '}
          ago, and the target is {spacingHours}. If today’s an option, an impact
          session might serve you better; if this is your gym day, go a little lighter.
        </div>
      )}

      <div className={styles.bracingCard}>
        <div className={styles.bracingTitle}>{p.label}</div>
        <p className={styles.bracingBody}>{p.blurb}</p>
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
            ? 'On sets of five, take that breath, brace, and hold it through the hardest part of the rep. Breathe out at the top, then take a fresh breath for the next one. (If you have high blood pressure, keep breathing out through the lift instead.)'
            : 'Breathe in and brace before each rep, then breathe out steadily as you stand up or press.'}
        </p>
      </div>

      <div className={styles.bracingCard}>
        <div className={styles.bracingTitle}>How hard, and how long to rest</div>
        <p className={styles.bracingBody}>
          Finish each set with about {repsLeft} good reps still in you. That’s
          what the {p.rx.target_rpe} in the RPE column means. If a set felt
          harder, nudge the number up; easier, nudge it down. You’re estimating,
          not measuring, and the next session’s weight follows what you log.
        </p>
        <p className={styles.bracingBody}>
          Every card shows its rest, and the timer starts when you tick a set
          off. {heavy ? 'Sets of five get longer: three minutes after squats and deadlifts.' : 'More after squats and deadlifts, less after the press.'}{' '}
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
        <SlotCard key={slot.id} slot={slot} scope="gym" phase={phase.phase} />
      ))}

      <div className={styles.finisherLabel}>Finish with</div>
      <FinisherCard
        exKey={lowBoneDensity ? 'landing_small_jumps' : 'drop_landing'}
        label="Landings"
        {...FINISHER.landing}
        unit={lowBoneDensity ? 'jumps' : FINISHER.landing.unit}
      >
        {!lowBoneDensity && (
          <p className={fstyles.level}>
            Today: <strong>{drop.name}</strong>, {drop.height}: {drop.where}. The
            height goes up every {DROP_LEVEL_EVERY} gym sessions.
          </p>
        )}
      </FinisherCard>
      <FinisherCard exKey={carryKey} label="Carry" {...FINISHER.carry} />
      <FinisherCard
        exKey={day.finisher.core.key}
        label="Core"
        {...FINISHER.core}
        reps={day.finisher.core.reps}
        unit={day.finisher.core.unit}
      />

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

// ── Impact session: five sets of ten, a minute between ──────────────────────
function ImpactSession({ day, onFinish }) {
  const sets = useSessionStore((s) => s.impactSets);
  const setImpactSets = useSessionStore((s) => s.setImpactSets);
  const lowBoneDensity = useSettingsStore((s) => s.lowBoneDensity);
  const { data } = useSessions();
  const resting = useRestTimer((t) => t.visible);
  const remaining = useRestTimer((t) => t.remaining);
  const startTimer = useRestTimer((t) => t.start);

  const lvlIdx = impactLevel(data ?? [], {
    levels: IMPACT_LEVELS.length, every: IMPACT_LEVEL_EVERY, capLow: lowBoneDensity,
  });
  const level = IMPACT_LEVELS[lvlIdx];
  const done = sets >= IMPACT_SETS;

  const setDone = () => {
    const next = sets + 1;
    setImpactSets(next);
    // Rest between sets, not after the last one.
    if (next < IMPACT_SETS) startTimer({ exerciseName: 'Next set of jumps', role: 'jump', rpe: null, auto: false });
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
          <span className={styles.counterNum}>{sets}</span>
          <span className={styles.counterOf}>/ {IMPACT_SETS} sets</span>
        </div>
        <div className={styles.dots} aria-hidden>
          {Array.from({ length: IMPACT_SETS }, (_, i) => (
            <span key={i} className={i < sets ? styles.dotOn : styles.dot} />
          ))}
        </div>

        {done ? (
          <p className={styles.impactDone}>All {IMPACT_SETS * JUMPS_PER_SET} jumps done. Finish to log it.</p>
        ) : (
          <button type="button" className={styles.jumpBtn} onClick={setDone} disabled={resting}>
            {resting ? `Rest · ${formatClock(remaining)}` : `Set ${sets + 1} done · ${JUMPS_PER_SET} jumps`}
          </button>
        )}
        <p className={styles.impactWhy}>
          About fifty jumps, on most days of the week, is what the Australian
          and UK bone-health guidance recommends. The minute between sets is part
          of the recipe: bone responds better to short bouts with rest between
          them than to one long one.
        </p>
      </div>

      {lowBoneDensity && (
        <p className={styles.spacingNote}>
          Your low-bone-density setting keeps impact at small jumps. UK
          guidance for osteoporosis avoids landing from a height, and after a
          spine fracture, or more than one fracture from a minor fall, keeps
          impact to about brisk walking. A physio can tell you which applies.
        </p>
      )}

      <button type="button" className={common.cta} onClick={onFinish}>
        {done
          ? 'Finish session →'
          : sets >= MIN_SETS_TO_COUNT
            ? 'Finish early (still counts) →'
            : sets > 0 ? 'Stop (won’t count yet) →' : 'Cancel'}
      </button>
    </main>
  );
}
