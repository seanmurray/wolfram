import styles from './ExerciseHistoryInline.module.css';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { formatDate } from '../lib/dateFormat';

// Inline "Recent" block — last 3 sessions of one exercise.
//   'sets' — set-table exercises (set count × reps @ weight · RPE)
//   'perf' — Move-day cardio (minutes · RPE)
// Renders nothing when there's no prior data.
export function ExerciseHistoryInline({ exerciseKey, kind = 'sets' }) {
  const { data, isLoading } = useExerciseHistory(exerciseKey, kind);

  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <div className={styles.history}>
      <div className={styles.label}>Recent</div>
      {data.map((row) => (
        <div key={row.sessionId} className={styles.row}>
          <span className={styles.date}>{formatDate(row.performedAt)}</span>
          <span className={styles.dash}>—</span>
          <span className={styles.body}>
            {kind === 'sets' ? summarizeSets(row.sets) : summarizePerf(row)}
          </span>
        </div>
      ))}
    </div>
  );
}

// "N×R @ W lbs · RPE X" — top working set summary.
function summarizeSets(sets) {
  if (!sets?.length) return '—';
  const valid = sets.filter((s) => s.actual_reps != null || s.actual_weight != null);
  if (!valid.length) return '—';

  const weights = valid.map((s) => s.actual_weight ?? 0);
  const topWeight = Math.max(...weights);
  const atTop = valid.filter((s) => (s.actual_weight ?? 0) === topWeight);
  const topReps = Math.max(...atTop.map((s) => s.actual_reps ?? 0));
  const rpes = valid.map((s) => s.rpe ?? 0).filter((n) => n > 0);
  const topRpe = rpes.length ? Math.max(...rpes) : null;

  const parts = [`${valid.length}×${topReps}`];
  if (topWeight > 0) parts.push(`@ ${topWeight} lbs`);
  if (topRpe != null) parts.push(`RPE ${topRpe}`);
  return parts.join(' · ');
}

function summarizePerf(row) {
  const parts = [];
  if (row.notes) parts.push(row.notes);
  if (row.effortRpe != null) parts.push(`RPE ${row.effortRpe}`);
  return parts.length ? parts.join(' · ') : '—';
}
