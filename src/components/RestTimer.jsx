import { useEffect } from 'react';
import styles from './RestTimer.module.css';
import { useShallow } from 'zustand/react/shallow';
import { useRestTimer } from '../stores/restTimerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { formatClock, formatRest } from '../lib/rest';

// Hold a screen wake lock while a rest timer is on screen so the phone doesn't
// dim/sleep mid-rest and swallow the end sound. Auto-released by the browser
// when the page is hidden (switching apps), so we re-acquire on return. This
// only helps the "phone on the desk, app open" case — a backgrounded PWA can't
// keep the lock or fire audio. Supported on iOS 16.4+ and Android Chrome.
function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch { /* denied / not allowed while hidden — ignore */ }
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}

const CIRCUMFERENCE = 138; // r=22 → 2πr ≈ 138.2

// Ring color shifts green → amber → red as time runs low (spec §10).
function ringColor(remaining, total) {
  const pct = total > 0 ? remaining / total : 0;
  if (pct > 0.5)  return 'var(--green)';
  if (pct > 0.2)  return 'var(--amber)';
  return 'var(--red)';
}

export function RestTimer() {
  const { visible, exerciseName, total, remaining, rpeNote } = useRestTimer(
    useShallow((s) => ({
      visible: s.visible,
      exerciseName: s.exerciseName,
      total: s.total,
      remaining: s.remaining,
      rpeNote: s.rpeNote,
    }))
  );
  const adjust = useRestTimer((s) => s.adjust);
  const skip = useRestTimer((s) => s.skip);
  const keepAwake = useSettingsStore((s) => s.timerPrefs.keepAwake);

  // Default on for existing installs whose persisted prefs predate this flag.
  useWakeLock(visible && keepAwake !== false);

  if (!visible) return null;

  const offset = total > 0 ? CIRCUMFERENCE * (1 - remaining / total) : 0;

  return (
    <div className={styles.float} role="status" aria-live="polite">
      <div className={styles.row}>
        <div className={styles.ringWrap}>
          <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
            <circle cx="30" cy="30" r="22" fill="none" strokeWidth="5" className={styles.track} />
            <circle
              cx="30" cy="30" r="22" fill="none" strokeWidth="5"
              stroke={ringColor(remaining, total)}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className={styles.value}
            />
          </svg>
          <div className={styles.center}>
            <div className={styles.countdown}>{formatClock(remaining)}</div>
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.label}>Rest {formatRest(total)}</div>
          <div className={styles.exname}>{exerciseName}</div>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.adj} onClick={() => adjust(-15)} aria-label="Subtract 15 seconds">−15</button>
          <button type="button" className={styles.adj} onClick={() => adjust(15)}  aria-label="Add 15 seconds">+15</button>
          <button type="button" className={styles.skip} onClick={skip}             aria-label="Skip rest">▸</button>
        </div>
      </div>

      {/* Why this rest is the length it is. Full width on its own row — it's a
          sentence, and the strip between the ring and the buttons is ~90px. */}
      {rpeNote && <div className={styles.why}>{rpeNote}</div>}
    </div>
  );
}
