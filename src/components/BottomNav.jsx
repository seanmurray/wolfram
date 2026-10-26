import styles from './BottomNav.module.css';

// Line icons drawn in currentColor, so they take the nav's ink and active
// colours. Text glyphs like ⚡ render as colour emoji on iOS.
const ICONS = {
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  workout: (
    <>
      <path d="M3 12h18" />
      <rect x="5" y="7" width="3" height="10" rx="1" />
      <rect x="16" y="7" width="3" height="10" rx="1" />
    </>
  ),
  classes: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="var(--bg-blur)" />
      <circle cx="15" cy="12" r="2" fill="var(--bg-blur)" />
      <circle cx="7" cy="17" r="2" fill="var(--bg-blur)" />
    </>
  ),
};

const TABS = [
  { id: 'today',    label: 'Today' },
  { id: 'workout',  label: 'Workout' },
  { id: 'classes',  label: 'Classes' },
  { id: 'history',  label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav className={styles.bnav} aria-label="Primary navigation">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.item} ${active === t.id ? styles.active : ''}`}
          onClick={() => onChange(t.id)}
          aria-current={active === t.id ? 'page' : undefined}
        >
          <svg
            className={styles.svg}
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {ICONS[t.id]}
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
