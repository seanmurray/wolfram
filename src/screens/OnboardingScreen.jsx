import { useState } from 'react';
import styles from './OnboardingScreen.module.css';
import { EQUIPMENT } from '../data/program';
import { useSettingsStore } from '../stores/settingsStore';

// First-run screen — one friendly question: what do you have on hand?
// Every workout slot resolves against this, and it's editable any time in
// Settings, so there's no wrong answer. "Nothing yet" is a complete program.
export function OnboardingScreen() {
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [picked, setPicked] = useState(new Set());

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <main className={`screen ${styles.wrap}`}>
      <div className={styles.lockup}>
        <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className={styles.mark} />
        <span className={styles.wordmark}>Wolfram</span>
      </div>
      <p className={styles.tagline}>
        Strength for the long run. Heavy lifting and impact work — the loading
        bone actually responds to — fitted around the classes you already love.
        Everything stays on your phone.
      </p>

      <div className={styles.question}>What equipment do you have on hand?</div>
      <div className={styles.hint}>
        Tap everything that applies — or nothing at all. The plan adapts
        either way, and you can change this in Settings whenever.
      </div>

      <div className={styles.grid}>
        {EQUIPMENT.map((eq) => {
          const on = picked.has(eq.id);
          return (
            <button
              key={eq.id}
              type="button"
              className={`${styles.card} ${on ? styles.on : ''}`}
              onClick={() => toggle(eq.id)}
              aria-pressed={on}
            >
              <span className={styles.check}>{on ? '✓' : ''}</span>
              <span className={styles.label}>{eq.label}</span>
              <span className={styles.eqHint}>{eq.hint}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.cta}
        onClick={() => completeOnboarding([...picked])}
      >
        {picked.size === 0 ? 'Start with just my bodyweight →' : 'Build my plan →'}
      </button>
    </main>
  );
}
