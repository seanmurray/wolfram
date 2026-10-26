import styles from './TodayScreen.module.css';
import chips from '../components/Buckets.module.css';
import { useSessions } from '../hooks/useSessions';
import { useSettingsStore } from '../stores/settingsStore';
import { useClassStore, overridesFor } from '../stores/classStore';
import { suggestToday, heavyPhase, impactLevel } from '../lib/plan.js';
import { FORMATS } from '../lib/classify.js';
import { WEEKDAYS, WEEKDAYS_LONG, weekdayIndex, formatTime } from '../lib/week.js';
import { BUCKET_LABEL, fillsText } from '../lib/labels.js';
import { PHASES, IMPACT_LEVELS, IMPACT_LEVEL_EVERY } from '../data/program';

// Today: what this week has delivered, the one thing to do next, and which of
// the user's classes are worth booking. Everything derives from lib/plan.js.
export function TodayScreen({ onStart, onLogClass, onOpenClasses }) {
  const { data } = useSessions();
  const sessions = data ?? [];
  const targets = useSettingsStore((s) => s.targets);
  const lowBoneDensity = useSettingsStore((s) => s.lowBoneDensity);
  const availability = useSettingsStore((s) => s.availability);
  const library = useClassStore((s) => s.library);
  const overrideState = useClassStore((s) => s.overrides);
  const toggleOverride = useClassStore((s) => s.toggleOverride);

  const now = new Date();
  const overrides = overridesFor({ overrides: overrideState }, now);
  const suggestion = suggestToday({ library, sessions, targets, now, overrides, availability });
  const { tally, occurrences, windows, uncovered } = suggestion.plan;
  const phase = heavyPhase(sessions);
  const level = IMPACT_LEVELS[impactLevel(sessions, {
    levels: IMPACT_LEVELS.length, every: IMPACT_LEVEL_EVERY, capLow: lowBoneDensity,
  })];

  return (
    <main className="screen">
      <div className="overline">
        {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
      <div className="title-xl">Today</div>

      <section className={styles.tally} aria-label="This week">
        {['heavy', 'impact', 'studio'].map((b) => {
          const goal = targets[b];
          const met = goal > 0 && tally[b] >= goal;
          return (
            <div key={b} className={`${styles.meter} ${styles[b]} ${met ? styles.met : ''}`}>
              <div className={styles.meterCount}>
                {tally[b]}
                {goal > 0 && <span className={styles.meterGoal}>/{goal}</span>}
              </div>
              <div className={styles.meterLabel}>{BUCKET_LABEL[b]}</div>
              <div className={styles.meterBar} aria-hidden>
                <span style={{ width: `${goal > 0 ? Math.min(100, (tally[b] / goal) * 100) : 0}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <Suggestion
        s={suggestion}
        phase={phase}
        level={level}
        onStart={onStart}
        onLogClass={onLogClass}
      />

      <div className={styles.quick}>
        <button type="button" className={styles.quickBtn} onClick={() => onLogClass(null)}>Log a class</button>
        <button type="button" className={styles.quickBtn} onClick={() => onStart('impact')}>Impact set</button>
        <button type="button" className={styles.quickBtn} onClick={() => onStart('gym')}>Home gym</button>
      </div>

      <div className={styles.sectionLabel}>This week’s classes</div>
      {library.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>
            Add the classes you take, or could take, and Wolfram will point out
            which ones to book to cover your heavy and impact days.
          </p>
          <button type="button" className={styles.emptyBtn} onClick={onOpenClasses}>Add your classes</button>
        </div>
      ) : occurrences.length === 0 ? (
        <p className={styles.quiet}>No more classes on your list this week.</p>
      ) : (
        <ul className={styles.planner}>
          {occurrences.map((o) => {
            const day = weekdayIndex(o.at);
            const isToday = day === weekdayIndex(now);
            const unavailable = o.level === 'no';
            const status = o.skipped
              ? 'Can’t make it this week'
              : o.reason === 'offWeekend'
                ? 'Not one of your free weekends'
                : o.reason === 'outside'
                  ? 'Outside your usual class times'
                  : o.fills.length
                    ? (o.level === 'sometimes' ? 'If you can get there: ' : '') + fillsText(o.fills).replace(/^C/, o.level === 'sometimes' ? 'c' : 'C')
                    : o.tooSoon
                      ? 'Too close to another heavy day'
                      : null;
            const btn = o.override ? 'Undo' : unavailable ? 'I can go' : 'Can’t go';
            const btnAria = o.override
              ? `Undo this week’s change for ${WEEKDAYS_LONG[day]}`
              : unavailable ? `I can make ${WEEKDAYS_LONG[day]} this week` : `I can’t make ${WEEKDAYS_LONG[day]} this week`;
            return (
              <li
                key={`${o.cls.id}-${o.at.toISOString()}`}
                className={`${styles.occ} ${o.fills.length ? styles.occFills : ''} ${o.skipped ? styles.occSkipped : unavailable ? styles.occOff : ''}`}
              >
                <div className={styles.occWhen}>
                  <span className={styles.occDay}>{isToday ? 'Today' : WEEKDAYS[day]}</span>
                  <span className={styles.occTime}>{formatTime(o.cls.time)}</span>
                </div>
                <div className={styles.occMain}>
                  <div className={styles.occName}>{o.cls.name}</div>
                  {o.cls.studio && <div className={styles.occStudio}>{o.cls.studio}</div>}
                  <div className={styles.occMeta}>
                    <span className={`${chips.chip} ${chips[o.cls.format]}`}>{FORMATS[o.cls.format]?.label}</span>
                    {status && <span className={styles.occStatus}>{status}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.skipBtn}
                  onClick={() => toggleOverride(day, !unavailable, now)}
                  aria-label={btnAria}
                >
                  {btn}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {windows.length > 0 && (
        <section className={styles.windows} aria-label="Room for a heavy class">
          <div className={styles.windowsTitle}>Room for a heavy class</div>
          <p className={styles.windowsBody}>
            You still need {uncovered.heavy === 1 ? 'one heavy session' : `${uncovered.heavy} heavy sessions`} this
            week, and nothing’s booked{' '}
            {windows.map((w, i) => {
              const wd = weekdayIndex(w.at);
              const label = wd === weekdayIndex(now)
                ? (w.part === 'evening' ? 'tonight' : 'today')
                : `${WEEKDAYS_LONG[wd]}${w.part === 'evening' ? ' evening' : ''}`;
              return (
                <span key={wd}>
                  {i > 0 && (i === windows.length - 1 ? ' or ' : ', ')}
                  <strong>{label}</strong>
                </span>
              );
            })}
            . Search ClassPass for a barbell or lifting class then, and add it on
            the Classes tab if it’s a regular.
          </p>
        </section>
      )}

      <p className={styles.footNote}>
        Took a class earlier in the week? Log it from “Log a class” and pick
        the day.
      </p>
    </main>
  );
}

function Suggestion({ s, phase, level, onStart, onLogClass }) {
  const phaseLine = phase.phase === 'learn'
    ? `${PHASES.learn.label} · session ${phase.next} of ${phase.of}`
    : `${PHASES.heavy.label} · session ${phase.next}`;

  let title, body, action = null;
  switch (s.type) {
    case 'class': {
      const { cls, at } = s.occurrence;
      title = cls.name;
      body = `${formatTime(cls.time)}${cls.studio ? ` at ${cls.studio}` : ''}. ${fillsText(s.occurrence.fills)}.`;
      action = { label: 'Took it? Log it', run: () => onLogClass(cls.id, at) };
      break;
    }
    case 'gym':
      title = 'Heavy session at the home gym';
      body = `If you’re at the home gym today, this is the one. ${phaseLine}.`;
      action = { label: 'Start heavy session', run: () => onStart('gym') };
      break;
    case 'impact':
      title = 'An impact set';
      body = `Ten jumps, thirty seconds apart: five minutes, anywhere. Today’s level: ${level.name.toLowerCase()}.`;
      action = { label: 'Start impact set', run: () => onStart('impact') };
      break;
    case 'studio':
      title = 'A studio class you love';
      body = 'Your studio goal for the week still has room.';
      action = { label: 'Log a class', run: () => onLogClass(null) };
      break;
    case 'onTrack':
      title = 'You’re on track';
      body = 'The classes on your list cover the rest of the week. Nothing extra needed today.';
      break;
    default:
      title = 'Covered for the week';
      body = 'Every goal is met. Enjoy any class you like.';
  }

  return (
    <section className={styles.suggest} aria-label="Today’s suggestion">
      <div className={styles.suggestLabel}>Today’s best move</div>
      <div className={styles.suggestTitle}>{title}</div>
      <p className={styles.suggestBody}>{body}</p>
      {action && (
        <button type="button" className={styles.suggestBtn} onClick={action.run}>{action.label}</button>
      )}
    </section>
  );
}
