import { useEffect, useState } from 'react';
import styles from './PostSessionSheet.module.css';

// Captures post-session RPE + Energy before save. The AI debrief uses these
// directly; before this existed we were hardcoding 7.5/3 and the debrief
// was lying about how hard the session felt.
//
// open: bool — controls slide-up
// saving: bool — disables CTA + shows working state
// onCancel — close without saving
// onConfirm({ sessionRpe, energy }) — fired when the user hits Save Session
export function PostSessionSheet({ open, saving, onCancel, onConfirm }) {
  const [sessionRpe, setSessionRpe] = useState(6.5);
  const [energy, setEnergy] = useState(3);

  // Reset defaults on each open so the sliders don't carry yesterday's values.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setSessionRpe(6.5);
      setEnergy(3);
    }
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.open : ''}`}
        onClick={() => !saving && onCancel?.()}
        aria-hidden
      />
      <div className={`${styles.sheet} ${open ? styles.open : ''}`} role="dialog" aria-modal="true" aria-label="Finish session">
        <div className={styles.handle} />
        <div className={styles.header}>
          <div className={styles.title}>Finish session</div>
          <div className={styles.sub}>How did that feel? 7 = worked hard with reps to spare</div>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <div className={styles.label}>Overall effort</div>
            <input
              type="range"
              min="5"
              max="10"
              step="0.5"
              value={sessionRpe}
              className={styles.range}
              onChange={(e) => setSessionRpe(Number(e.target.value))}
              aria-label="Session RPE"
            />
            <div className={styles.val}>{sessionRpe}</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>Energy</div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={energy}
              className={styles.range}
              onChange={(e) => setEnergy(Number(e.target.value))}
              aria-label="Post-session energy"
            />
            <div className={styles.val}>{energy}/5</div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.cta}
              onClick={() => onConfirm({ sessionRpe, energy })}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Session →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
