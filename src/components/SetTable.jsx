import { useState } from 'react';
import { SetRow, SetTableHeader, AdaptNote } from './SetRow';
import { computeNextRec, seedBaseRec, topSet } from '../lib/setAdjust';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { useSessionStore } from '../stores/sessionStore';
import { useRestTimer } from '../stores/restTimerStore';
import { RestGuide } from './RestGuide';

// SetTable — owns per-set local state for one exercise, buffers each
// completed set into the session store, and triggers the rest timer.
//
// Wolfram has no %1RM math: the weight recommendation seeds entirely from
// YOUR last session's top set (setAdjust closes the loop within a session).
// First time on an exercise there's simply no recommendation — pick something
// that leaves 2-3 reps in the tank.
export function SetTable({
  exerciseKey,
  exerciseName,
  prescription,
  role,
  context = 'strength',
  showWeight = true,
}) {
  const dayId = useSessionStore((s) => s.dayId);
  const pushSet = useSessionStore((s) => s.pushSet);
  const startTimer = useRestTimer((t) => t.start);

  const numSets = prescription?.sets ?? 2;
  const baseReps = prescription?.reps ?? 8;
  const targetRPE = prescription?.target_rpe ?? 7;

  // Last completed session for this exercise — seeds the recommendation.
  const { data: history } = useExerciseHistory(exerciseKey, 'sets');
  const lastTop = history?.[0] ? topSet(history[0].sets) : null;

  const baseRec = showWeight ? seedBaseRec({ calcRec: 0, prescription, lastTop }) : 0;

  const [rows, setRows] = useState(() =>
    Array.from({ length: numSets }, () => ({
      reps: null,
      weight: null,
      rpe: targetRPE,
      done: false,
    }))
  );
  const [adaptNote, setAdaptNote] = useState(null);
  // Effort from the most recently completed set — drives the rest suggestion
  // shown on the card. Null until something is logged.
  const [lastRpe, setLastRpe] = useState(null);

  function recForSet(idx) {
    if (!showWeight) return { value: null, variant: 'ok', note: null };
    if (baseRec == null || baseRec === 0) return { value: null, variant: 'ok', note: null };

    const priorRows = rows.slice(0, idx);
    const { rec, note } = computeNextRec({ baseRec, prescription, history: priorRows });

    const actual = rows[idx]?.weight;
    if (actual == null) return { value: rec, variant: 'ok', note };
    const diff = Math.abs(actual - rec);
    const variant = diff > 20 ? 'danger' : diff > 10 ? 'warn' : 'ok';
    return { value: rec, variant, note };
  }

  function update(idx, patch) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function handleToggleDone(idx) {
    const row = rows[idx];
    const willBeDone = !row.done;

    update(idx, { done: willBeDone });
    if (!willBeDone) return;

    const reps = row.reps ?? baseReps;
    const weight = showWeight ? (row.weight ?? recForSet(idx).value ?? 0) : null;
    const rpe = row.rpe ?? targetRPE;

    pushSet({
      exercise_key: exerciseKey,
      exercise_name: exerciseName,
      set_num: idx + 1,
      actual_reps: reps,
      actual_weight: weight,
      rpe,
      day_id: dayId,
      performed_at: new Date().toISOString(),
    });

    if (idx < rows.length - 1) {
      const nextRec = computeNextRec({
        baseRec,
        prescription,
        history: rows.map((r, i) => (i === idx ? { ...r, done: true } : r)).slice(0, idx + 1),
      });
      setAdaptNote(nextRec.note);
    }

    setLastRpe(rpe);
    startTimer({ exerciseName, role, context, rpe, auto: true });
  }

  return (
    <>
      <SetTableHeader showWeight={showWeight} />
      {rows.map((row, idx) => {
        const rec = recForSet(idx);
        return (
          <SetRow
            key={idx}
            setNum={idx + 1}
            reps={row.reps}
            onRepsChange={(v) => update(idx, { reps: v })}
            weight={row.weight}
            onWeightChange={(v) => update(idx, { weight: v })}
            rec={rec.value}
            recVariant={rec.variant}
            rpe={row.rpe}
            onRpeChange={(v) => update(idx, { rpe: v })}
            done={row.done}
            onToggleDone={() => handleToggleDone(idx)}
            showWeight={showWeight}
          />
        );
      })}
      {adaptNote && <AdaptNote>{adaptNote}</AdaptNote>}
      <RestGuide
        exerciseName={exerciseName}
        role={role}
        context={context}
        lastRpe={lastRpe}
      />
    </>
  );
}
