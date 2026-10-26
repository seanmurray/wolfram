import { useState } from 'react';
import styles from './SlotSwapControl.module.css';
import { EX } from '../data/exercises';
import { availableVariants } from '../data/program';
import { useSlotStore } from '../stores/slotStore';
import { useSettingsStore } from '../stores/settingsStore';

// Manual swap picker for one slot: the variants your equipment allows as
// pills, a custom entry for anything off-menu, and a Today / From-now-on
// scope choice.
export function SlotSwapControl({ slot, slotId, activeKey, isCustom }) {
  const swapToday = useSlotStore((s) => s.swapToday);
  const swapAlways = useSlotStore((s) => s.swapAlways);
  const clearSlot = useSlotStore((s) => s.clearSlot);
  const todayChoice = useSlotStore((s) => s.today[slotId]);
  const alwaysChoice = useSlotStore((s) => s.always[slotId]);
  const equipment = useSettingsStore((s) => s.equipment);

  const manualActive = !!todayChoice || !!alwaysChoice;
  const [scope, setScope] = useState(alwaysChoice ? 'always' : 'today');
  const [customName, setCustomName] = useState('');

  const pool = availableVariants(slot.variants, equipment);

  const apply = (choice) => {
    if (scope === 'always') swapAlways(slotId, choice);
    else swapToday(slotId, choice);
  };

  const changeScope = (next) => {
    setScope(next);
    const choice = todayChoice ?? alwaysChoice ?? null;
    if (!choice) return;
    if (next === 'always') swapAlways(slotId, choice);
    else swapToday(slotId, choice);
  };

  const submitCustom = () => {
    const n = customName.trim();
    if (!n) return;
    apply({ custom: n });
    setCustomName('');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>Swap this slot</div>

      <div className={styles.scopeRow}>
        <button type="button" className={`${styles.scopeBtn} ${scope === 'today' ? styles.on : ''}`} onClick={() => changeScope('today')}>
          Just today
        </button>
        <button type="button" className={`${styles.scopeBtn} ${scope === 'always' ? styles.on : ''}`} onClick={() => changeScope('always')}>
          From now on
        </button>
      </div>

      <div className={styles.pills}>
        {pool.map((k) => {
          const isActive = !isCustom && k === activeKey;
          return (
            <button
              key={k}
              type="button"
              className={`${styles.pill} ${isActive ? styles.active : ''}`}
              onClick={() => (isActive ? clearSlot(slotId) : apply({ key: k }))}
            >
              {EX[k]?.name ?? k}
            </button>
          );
        })}
      </div>

      <div className={styles.customRow}>
        <input
          className={styles.customInput}
          type="text"
          placeholder="Something else entirely…"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitCustom(); }}
        />
        <button type="button" className={styles.customSet} onClick={submitCustom}>Use it</button>
      </div>

      {manualActive && (
        <button type="button" className={styles.reset} onClick={() => clearSlot(slotId)}>
          ↺ Back to the suggested exercise
        </button>
      )}
    </div>
  );
}
