import styles from './SetRow.module.css';
import { NumField } from './NumField';

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export function SetTableHeader({ showWeight = true }) {
  return (
    <div className={styles.tableHeader}>
      <div className={styles.colLabel}>#</div>
      <div className={styles.colLabel}>Reps</div>
      <div className={styles.colLabel}>{showWeight ? 'Lbs' : ''}</div>
      <div className={styles.colLabel}>Rec</div>
      <div className={styles.colLabel}>RPE</div>
      <div className={styles.colLabel}></div>
    </div>
  );
}

// One set row. The parent owns reps/weight/rpe state and the done flag — this
// component is purely presentational so the parent can drive intra-session
// load adaptation off rpe deltas.
export function SetRow({
  setNum,
  reps, onRepsChange,
  weight, onWeightChange,
  rec,                          // recommended weight (number) or null
  recVariant = 'ok',            // 'ok' | 'warn' | 'danger' — colors the rec cell
  rpe, onRpeChange,
  done, onToggleDone,
  showWeight = true,
}) {
  const recVariantCls =
    recVariant === 'warn'   ? styles.warn :
    recVariant === 'danger' ? styles.danger : '';

  return (
    <div className={styles.row}>
      <div className={styles.num}>{setNum}</div>

      {/* Reps are whole numbers; weight allows decimals (2.5 lb plates, 7.5 lb
          DBs, per-hand loads). Both use NumField so a controlled input doesn't
          eat the decimal point mid-typing — see NumField for the why. */}
      <NumField
        decimal={false}
        className={styles.input}
        value={reps}
        onChange={onRepsChange}
        aria-label={`Set ${setNum} reps`}
      />

      {showWeight ? (
        <NumField
          className={styles.input}
          value={weight}
          onChange={onWeightChange}
          aria-label={`Set ${setNum} weight`}
        />
      ) : (
        <div />
      )}

      <div className={`${styles.recCell} ${recVariantCls}`}>
        {rec != null && rec > 0 ? rec : '—'}
      </div>

      <select
        className={styles.rpe}
        value={rpe ?? ''}
        onChange={(e) => {
          // iOS Safari has a known issue reading .value on selects with
          // -webkit-appearance: none. Use selectedIndex instead.
          const idx = e.target.selectedIndex;
          const opt = e.target.options[idx];
          onRpeChange(opt.value === '' ? null : Number(opt.value));
        }}
        aria-label={`Set ${setNum} RPE`}
      >
        <option value="">—</option>
        {RPE_VALUES.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <button
        type="button"
        className={`${styles.done} ${done ? styles.completed : ''}`}
        onClick={onToggleDone}
        aria-pressed={done}
        aria-label={`Mark set ${setNum} done`}
      />
    </div>
  );
}

export function AdaptNote({ children }) {
  return <div className={styles.adaptNote}>{children}</div>;
}
