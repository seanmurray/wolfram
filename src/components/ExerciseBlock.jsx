import { useState } from 'react';
import styles from './ExerciseBlock.module.css';
import { ExerciseNote } from './ExerciseNote';

// Expandable card: header (name/target/load/tempo) on top, optional cue +
// body content (children) inside when expanded. Wraps the strength sets,
// agility/plyo feedback, build sets — all the per-exercise UI.

export function ExerciseBlock({
  name,
  badge,         // optional { text, tone } — rotation/swap indicator under name
  exerciseKey,   // optional — when provided, renders a persistent form-cue note
  target,        // e.g. "4×3" or "5×3 @ 185"
  load,          // optional rec load string (e.g. "185 lbs")
  tempo,         // optional tempo string e.g. "[5|1|X]"
  cue,
  url,
  tags = [],
  contrast,      // realization-phase contrast cue (string)
  swaps = [],
  activeSwap = null,    // currently selected swap label, or null
  onSelectSwap,         // (label | null) => void — toggles the active swap
  originalName,         // when swap/upgrade is active, this is the canonical name to display in the note
  upgrade = null,       // optional { name, desc, prereq, url } variant
  upgradeActive = false,
  onToggleUpgrade,      // () => void — toggles upgrade on/off
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={styles.block}>
      <div
        role="button"
        tabIndex={0}
        className={styles.header}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); }
        }}
        aria-expanded={open}
      >
        <div>
          <div className={styles.name}>{name}</div>
          {badge && (
            <div
              style={{
                display: 'inline-block', marginTop: 4, fontSize: 12.5, fontWeight: 700,
                letterSpacing: '0.02em', padding: '3px 8px', borderRadius: 6,
                color: badge.tone === 'swap' ? 'var(--blue)' : badge.tone === 'custom' ? 'var(--amber)' : 'var(--purple)',
                background: badge.tone === 'swap' ? 'var(--blue-bg)' : badge.tone === 'custom' ? 'var(--amber-bg)' : 'var(--purple-bg)',
              }}
            >
              {badge.text}
            </div>
          )}
          {target && <div className={styles.target}>{target}</div>}
          {tags.length > 0 && (
            <div className={styles.tagRow}>
              {tags.map((t) => (
                <span key={t} className={`${styles.tag} ${styles[`tag${t[0].toUpperCase() + t.slice(1)}`] ?? ''}`}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={styles.metaRight}>
          {load  && <div className={styles.load}>{load}</div>}
          {tempo && <div className={styles.tempo}>{tempo}</div>}
        </div>
      </div>

      {open && (
        <div className={styles.body}>
          {cue && <div className={styles.cue}>{cue}</div>}

          {url && (
            <a href={url} target="_blank" rel="noreferrer" className={styles.video}>
              ▸ Watch
            </a>
          )}

          {contrast && (
            <div className={styles.contrastBox}>
              <strong>Contrast set:</strong> {contrast}
            </div>
          )}

          {exerciseKey && <ExerciseNote exerciseKey={exerciseKey} exerciseName={originalName ?? name} />}

          {upgrade && onToggleUpgrade && (
            <div className={styles.upgradeSection}>
              <button
                type="button"
                className={`${styles.upgradePill} ${upgradeActive ? styles.active : ''}`}
                onClick={onToggleUpgrade}
                aria-pressed={upgradeActive}
              >
                {upgradeActive ? '↥ Using upgrade' : '↥ Try upgrade'}
              </button>
              <div className={styles.upgradeBlock}>
                <div className={styles.upgradeName}>{upgrade.name}</div>
                <div className={styles.upgradeDesc}>{upgrade.desc}</div>
                {upgrade.prereq && (
                  <div className={styles.upgradePrereq}>Prereq: {upgrade.prereq}</div>
                )}
              </div>
            </div>
          )}

          {children}

          {swaps.length > 0 && (
            <div className={styles.swapSection}>
              <div className={styles.swapLabel}>
                {onSelectSwap ? 'Swap to' : 'Swaps'}
              </div>
              {onSelectSwap ? (
                <>
                  <div className={styles.swapList}>
                    {swaps.map((s) => {
                      const isActive = activeSwap === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`${styles.swapPill} ${isActive ? styles.active : ''}`}
                          onClick={() => onSelectSwap(isActive ? null : s)}
                          aria-pressed={isActive}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {activeSwap && (
                    <div className={styles.swapNote}>
                      Logging this set as <strong>{activeSwap}</strong>
                      {originalName ? ` (swap: ${originalName})` : ''}.
                    </div>
                  )}
                </>
              ) : (
                swaps.map((s) => (
                  <div key={s} className={styles.swapPill} style={{ display: 'inline-block', marginRight: 6, marginBottom: 6 }}>{s}</div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
