import { useState } from 'react';
import styles from './OnboardingScreen.module.css';
import { useSettingsStore } from '../stores/settingsStore';
import { AvailabilityEditor } from '../components/AvailabilityEditor';

// First run: what Wolfram does, when classes are realistic, and the one thing
// to do before heavy lifting and jumping. No equipment question: the home gym
// is preset (Settings can change it), and everything else is classes and
// bodyweight.
export function OnboardingScreen() {
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const saved = useSettingsStore((s) => s.availability);
  const setAvailability = useSettingsStore((s) => s.setAvailability);
  const [av, setAv] = useState(saved);

  // An alternating schedule needs its anchor: without it every weekend is a
  // guess, so this one question has to be answered.
  const needsWeekend = av.weekends === 'alternate' && !av.freeWeekendOf;
  const start = () => {
    if (needsWeekend) return;
    setAvailability(av);
    completeOnboarding();
  };

  return (
    <main className={`screen ${styles.wrap}`}>
      <div className={styles.lockup}>
        <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className={styles.mark} />
        <span className={styles.wordmark}>Wolfram</span>
      </div>
      <p className={styles.tagline}>
        Strength for the long run. Heavy lifting and impact work, the loading
        bone actually responds to, fitted around the classes you already love.
        Everything stays on your phone.
      </p>

      <ol className={styles.steps}>
        <li>
          <span className={styles.stepTitle}>Your classes stay at the centre.</span>
          Add the ones you take, and Wolfram shows which of them actually load
          bone, and which to book each week.
        </li>
        <li>
          <span className={styles.stepTitle}>It fills the gap.</span>
          Heavy lifting at the home gym and five-minute jump sets, sized to what
          your week still needs.
        </li>
        <li>
          <span className={styles.stepTitle}>One suggestion a day.</span>
          Log a class in a couple of taps and the week adds itself up.
        </li>
      </ol>

      <section className={styles.when}>
        <div className={styles.whenTitle}>When can you usually get to a class?</div>
        <p className={styles.whenSub}>
          Wolfram only plans classes around these times. You can change them,
          or any single week, whenever.
        </p>
        <AvailabilityEditor value={av} onChange={(patch) => setAv((a) => ({ ...a, ...patch }))} />
      </section>

      <div className={styles.dexa}>
        <div className={styles.dexaTitle}>Before you start</div>
        Ask your doctor about a DEXA scan for a baseline bone density reading,
        and check that heavy lifting and jumping are right for you. Wolfram is a
        training plan, not medical advice.
      </div>

      <button type="button" className={styles.cta} onClick={start} disabled={needsWeekend}>
        Let’s start
      </button>
      {needsWeekend && <p className={styles.needs}>Answer the weekend question above to start.</p>}
    </main>
  );
}
