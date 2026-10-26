import styles from './TodayScreen.module.css';
import { DAYS, DAY_ORDER, WEEK_SHAPE } from '../data/program';
import { useSessions } from '../hooks/useSessions';
import { useSettingsStore } from '../stores/settingsStore';

const DAY_EMOJI = { a: '🏋️', b: '🌿', move: '🚶' };

function daysThisWeek(sessions) {
  const now = new Date();
  const cutoff = new Date(now); cutoff.setDate(now.getDate() - 6); cutoff.setHours(0, 0, 0, 0);
  const days = new Set(
    (sessions ?? [])
      .filter((s) => new Date(s.performed_at) >= cutoff)
      .map((s) => new Date(s.performed_at).toDateString())
  );
  return days.size;
}

// Suggest the next day: whatever you did least recently, in A → Move → B order.
function suggestNext(sessions) {
  const lastOfEach = {};
  for (const s of sessions ?? []) {
    if (s.day_id && !lastOfEach[s.day_id]) lastOfEach[s.day_id] = s.performed_at;
  }
  const never = DAY_ORDER.find((d) => !lastOfEach[d]);
  if (never) return never;
  return DAY_ORDER.slice().sort((x, y) =>
    (lastOfEach[x] ?? '').localeCompare(lastOfEach[y] ?? '')
  )[0];
}

export function TodayScreen({ onStart }) {
  const { data: sessions } = useSessions();
  const weeklyGoal = useSettingsStore((s) => s.weeklyGoal);

  const thisWeek = daysThisWeek(sessions);
  const suggested = suggestNext(sessions);

  return (
    <main className="screen">
      <div className="overline">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
      <div className="title-xl">Today</div>

      <div className={styles.weekCard}>
        <div className={styles.weekCount}>
          {thisWeek}<span className={styles.weekGoal}>/{weeklyGoal}</span>
        </div>
        <div className={styles.weekText}>
          <div className={styles.weekLabel}>days this week</div>
          <div className={styles.weekShape}>{WEEK_SHAPE}</div>
        </div>
      </div>

      <div className={styles.sectionLabel}>Pick today's session</div>

      {DAY_ORDER.map((id) => {
        const day = DAYS[id];
        const isSuggested = id === suggested;
        return (
          <div key={id} className={`${styles.dayCard} ${isSuggested ? styles.suggested : ''}`}>
            <div className={styles.dayHead}>
              <span className={styles.dayEmoji}>{DAY_EMOJI[id]}</span>
              <div>
                <div className={styles.dayName}>
                  {day.name}
                  {isSuggested && <span className={styles.suggestTag}>suggested</span>}
                </div>
                <div className={styles.dayBlurb}>{day.blurb}</div>
              </div>
            </div>
            <button type="button" className={styles.startBtn} onClick={() => onStart(id)}>
              Start →
            </button>
          </div>
        );
      })}

      <p className={styles.footNote}>
        Consistency beats intensity — every session here leaves something in
        the tank on purpose.
      </p>
    </main>
  );
}
