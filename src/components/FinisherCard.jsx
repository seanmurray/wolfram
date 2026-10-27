import styles from './FinisherCard.module.css';
import { ExerciseBlock } from './ExerciseBlock';
import { EX } from '../data/exercises';
import { useSessionStore } from '../stores/sessionStore';
import { useRestTimer } from '../stores/restTimerStore';

// One item of the gym day's finisher: drop landings, a carry, or core.
// Ticked off set by set, never weighed. Each tick goes into the session's
// set buffer (so drop landings earn Impact credit on finish, and a reload
// mid-session keeps the count) and starts the rest timer between sets.
export function FinisherCard({ exKey, label, sets, reps, unit, role, children }) {
  const ex = EX[exKey];
  const dayId = useSessionStore((s) => s.dayId);
  const pushSet = useSessionStore((s) => s.pushSet);
  const done = useSessionStore((s) => s.setsBuffer.filter((x) => x.exercise_key === exKey).length);
  const startTimer = useRestTimer((t) => t.start);

  const tick = () => {
    const n = done + 1;
    pushSet({
      exercise_key: exKey,
      exercise_name: ex.name,
      set_num: n,
      actual_reps: reps,
      actual_weight: null,
      rpe: null,
      target_sets: sets,
      target_reps: reps,
      day_id: dayId,
      performed_at: new Date().toISOString(),
    });
    if (n < sets) startTimer({ exerciseName: ex.name, role, context: 'finisher', rpe: null, auto: true });
  };

  return (
    <ExerciseBlock
      exerciseKey={exKey}
      name={ex.name}
      originalName={ex.name}
      target={`${label} · ${sets === 1 ? '1 set' : `${sets} sets`} of ${reps} ${unit}`}
      cue={ex.cue}
      url={ex.url}
    >
      {children}
      <div className={styles.row}>
        <div className={styles.dots} aria-label={`${done} of ${sets} sets done`}>
          {Array.from({ length: sets }, (_, i) => (
            <span key={i} className={i < done ? styles.dotOn : styles.dot}>{i + 1}</span>
          ))}
        </div>
        {done < sets ? (
          <button type="button" className={styles.tick} onClick={tick}>
            {sets === 1 ? 'Done' : `Set ${done + 1} done`}
          </button>
        ) : (
          <span className={styles.complete}>Done ✓</span>
        )}
      </div>
    </ExerciseBlock>
  );
}
