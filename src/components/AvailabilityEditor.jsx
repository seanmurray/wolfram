import styles from './AvailabilityEditor.module.css';
import chips from './Buckets.module.css';
import { WEEKDAYS, dateInWeek, weekKey } from '../lib/week.js';
import { isFreeWeekend } from '../lib/plan.js';

const DAYTIME = [['usual', 'Usually'], ['sometimes', 'Sometimes'], ['no', 'Rarely']];
const WEEKENDS = [['every', 'Every weekend'], ['alternate', 'Every other'], ['never', 'Rarely']];
const short = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

// When classes are realistic. Shared by onboarding and Settings.
// value: availability (lib/plan.js); onChange(patch).
export function AvailabilityEditor({ value, onChange, now = new Date() }) {
  const sat = dateInWeek(now, 5);
  const sun = dateInWeek(now, 6);
  const thisFree = isFreeWeekend(sat, value.freeWeekendOf);
  const nextFreeSat = thisFree === null ? null : thisFree ? sat : dateInWeek(new Date(sat.getTime() + 7 * 86400000), 5);

  const toggleEvening = (d) =>
    onChange({
      evenings: value.evenings.includes(d)
        ? value.evenings.filter((x) => x !== d)
        : [...value.evenings, d].sort(),
    });

  // "Yes" anchors on this week; "no" on next week.
  const answerWeekend = (free) => {
    const anchor = free ? now : new Date(sat.getTime() + 7 * 86400000);
    onChange({ freeWeekendOf: weekKey(anchor) });
  };

  return (
    <div className={styles.editor}>
      <div className={styles.q}>Evenings, from 5 pm</div>
      <div className={chips.row}>
        {WEEKDAYS.slice(0, 5).map((label, d) => (
          <button
            key={label}
            type="button"
            aria-pressed={value.evenings.includes(d)}
            className={`${chips.pick} ${value.evenings.includes(d) ? chips.on : ''}`}
            onClick={() => toggleEvening(d)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.q}>During the workday</div>
      <div className={chips.row}>
        {DAYTIME.map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value.daytime === v}
            className={`${chips.pick} ${value.daytime === v ? chips.on : ''}`}
            onClick={() => onChange({ daytime: v })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.hint}>“Sometimes” classes are only suggested when your usual times can’t cover the week.</div>

      <div className={styles.q}>Weekends</div>
      <div className={chips.row}>
        {WEEKENDS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value.weekends === v}
            className={`${chips.pick} ${value.weekends === v ? chips.on : ''}`}
            onClick={() => onChange({ weekends: v })}
          >
            {label}
          </button>
        ))}
      </div>

      {value.weekends === 'alternate' && (
        <div className={styles.weekend}>
          <div className={styles.weekendQ}>
            Is this weekend free? <span className={styles.dates}>({short(sat)} – {short(sun)})</span>
          </div>
          <div className={chips.row}>
            <button
              type="button"
              aria-pressed={thisFree === true}
              className={`${chips.pick} ${thisFree === true ? chips.on : ''}`}
              onClick={() => answerWeekend(true)}
            >
              Yes, it’s free
            </button>
            <button
              type="button"
              aria-pressed={thisFree === false}
              className={`${chips.pick} ${thisFree === false ? chips.on : ''}`}
              onClick={() => answerWeekend(false)}
            >
              No, not this one
            </button>
          </div>
          {nextFreeSat && (
            <div className={styles.hint}>
              Next free weekend: {short(nextFreeSat)}. Every other weekend after that.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
