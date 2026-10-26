import styles from './RestGuide.module.css';
import { useRestTimer } from '../stores/restTimerStore';
import { restFor, formatRest, RPE_MEANING, TARGET_RPE } from '../lib/rest';

// The rest suggestion, stated on the card before the first set rather than
// only appearing once the timer fires. The user has no intuition for how long to
// wait between sets, so the number is always on screen, always explained, and
// always startable by hand — including when auto-start is switched off.
//
// `lastRpe` is the effort from the most recently ticked set. Before anything
// is logged it's null and we show the plain suggestion for the movement.
export function RestGuide({ exerciseName, role, context = 'strength', lastRpe = null }) {
  const start = useRestTimer((t) => t.start);
  const timerVisible = useRestTimer((t) => t.visible);

  const { seconds, adjusted, base, delta } = restFor({ role, context, rpe: lastRpe });

  // The timer's own row carries the coaching sentence ("that was hard — the
  // extra time protects your form"). Both are on screen at once, so this line
  // does the complementary job: what the number changed to, and which rating
  // moved it. Restating the RPE meaning every time is the point — that's the
  // part the user is still learning.
  const meaning = lastRpe != null ? RPE_MEANING[lastRpe] : null;
  let sub;
  if (lastRpe == null) {
    sub = `Tick a set off and the timer starts here. Rate how hard it felt and this adjusts — RPE ${TARGET_RPE} means ${RPE_MEANING[TARGET_RPE]}.`;
  } else if (!adjusted) {
    sub = `You logged RPE ${lastRpe}${meaning ? ` — ${meaning}` : ''}. Right where this is meant to sit.`;
  } else {
    sub = `${delta > 0 ? 'Up' : 'Down'} from the usual ${formatRest(base)} — you logged RPE ${lastRpe}${meaning ? ` (${meaning})` : ''}.`;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.headline}>
          Rest <span className={styles.time}>{formatRest(seconds)}</span> between sets
        </div>
        <button
          type="button"
          className={styles.start}
          onClick={() => start({ exerciseName, role, context, rpe: lastRpe })}
          disabled={timerVisible}
        >
          {timerVisible ? 'Running' : 'Start'}
        </button>
      </div>

      <div className={styles.sub}>{sub}</div>
    </div>
  );
}
