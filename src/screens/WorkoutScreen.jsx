import { useState } from 'react';
import styles from './WorkoutScreen.module.css';
import common from '../components/Common.module.css';
import wstyles from '../components/Warmup.module.css';
import { useShallow } from 'zustand/react/shallow';
import { DAYS, WARMUP } from '../data/program';
import { SlotCard } from '../components/SlotCard';
import { NumField } from '../components/NumField';
import { ExerciseHistoryInline } from '../components/ExerciseHistoryInline';
import { useSessionStore } from '../stores/sessionStore';

export function WorkoutScreen({ onFinish }) {
  const { dayId, warmupChecked, setWarmupChecked } = useSessionStore(
    useShallow((s) => ({
      dayId: s.dayId,
      warmupChecked: s.warmupChecked,
      setWarmupChecked: s.setWarmupChecked,
    }))
  );

  const day = dayId ? DAYS[dayId] : null;

  if (!day) {
    return (
      <main className="screen">
        <div className="title-lg">Workout</div>
        <p className={styles.empty}>
          No session running — head to Today and pick one. Your work saves as
          you go, so there's no wrong way to do this.
        </p>
      </main>
    );
  }

  const isMove = day.kind === 'move';
  const checklist = isMove ? day.mobility : WARMUP;
  const checklistTitle = isMove ? 'Five-minute mobility' : 'Warm-up — ~4 min';
  const allDone = warmupChecked.length === checklist.length;

  const toggleAll = () => {
    checklist.forEach((_, i) => setWarmupChecked(i, !allDone));
  };

  return (
    <main className="screen">
      <div className="overline">{isMove ? 'Easy day' : 'Strength day'}</div>
      <div className="title-lg">{day.name}</div>
      <p className={styles.blurb}>{day.blurb}</p>

      {!isMove && (
        <div className={styles.bracingCard}>
          <div className={styles.bracingTitle}>Bracing — you already know this</div>
          <p className={styles.bracingBody}>
            The breath control and body awareness you've built in practice are
            exactly what lifting calls bracing. Inhale low and wide into the
            lower ribs and belt line, keep a light firmness all the way around
            your middle — maybe 20%, never a crunch — and exhale slowly
            through the hard part of each rep. That quiet cylinder is what
            keeps the lower back happy under load. The same attention you can
            hold on the breath, hold on the muscle doing the work.
          </p>
        </div>
      )}

      {!isMove && (
        <div className={styles.bracingCard}>
          <div className={styles.bracingTitle}>How hard, and how long to rest</div>
          <p className={styles.bracingBody}>
            Finish most sets with about three good reps still in you. That's
            what the 7 in the RPE column means, and it's what every set starts
            on — if a set felt harder than that, nudge the number up; easier,
            nudge it down. You're estimating, not measuring. Nothing breaks if
            you're off by half a point.
          </p>
          <p className={styles.bracingBody}>
            Rest is the part that's easy to get wrong, so the app just tells
            you: long enough that your strength has actually come back, short
            enough that you don't go cold. Every card carries its own number —
            more after squats and hinges, less after balance work. The timer
            starts when you tick a set off and stretches or shrinks to match the
            effort you logged. Resting longer than it suggests is never the
            wrong call.
          </p>
        </div>
      )}

      {isMove && <MoveCard cardio={day.cardio} />}

      <div className={wstyles.card}>
        <div className={wstyles.head}>
          <div className={wstyles.title}>{checklistTitle}</div>
          <button
            type="button"
            className={`${wstyles.checkAll} ${allDone ? wstyles.allDone : ''}`}
            onClick={toggleAll}
          >
            {allDone ? 'All Done ✓' : 'Check All'}
          </button>
        </div>
        {checklist.map((text, i) => (
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

      {!isMove &&
        day.slots.map((slot) => <SlotCard key={slot.role} slot={slot} dayId={day.id} />)}

      <button type="button" className={common.cta} onClick={onFinish}>
        Finish Session →
      </button>
    </main>
  );
}

// Move-day cardio: log the minutes, that's the whole ask.
function MoveCard({ cardio }) {
  const pushPerf = useSessionStore((s) => s.pushPerf);
  const [minutes, setMinutes] = useState(null);
  const [saved, setSaved] = useState(false);

  const log = () => {
    if (!minutes || minutes <= 0) return;
    pushPerf({
      exercise_key: cardio.key,
      exercise_name: cardio.name,
      notes: `${Math.round(minutes)} min`,
      effort_rpe: null,
      performed_at: new Date().toISOString(),
    });
    setSaved(true);
  };

  return (
    <div className={styles.moveCard}>
      <div className={styles.moveName}>{cardio.name}</div>
      <div className={styles.moveTarget}>{cardio.targetMin} · conversational pace</div>
      <div className={styles.moveCue}>{cardio.cue}</div>
      <div className={styles.moveRow}>
        <NumField
          decimal={false}
          className={styles.moveInput}
          value={minutes}
          onChange={(v) => { setMinutes(v); setSaved(false); }}
          placeholder="minutes"
          aria-label="Minutes moved"
        />
        <button
          type="button"
          className={`${styles.moveLog} ${saved ? styles.moveLogged : ''}`}
          onClick={log}
          disabled={saved || !minutes}
        >
          {saved ? 'Logged ✓' : 'Log it'}
        </button>
      </div>
      <ExerciseHistoryInline exerciseKey={cardio.key} kind="perf" />
    </div>
  );
}
