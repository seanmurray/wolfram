import styles from './BottomNav.module.css';

const TABS = [
  { id: 'today',    label: 'Today',    icon: '☀' },
  { id: 'workout',  label: 'Workout',  icon: '⚡' },
  { id: 'history',  label: 'History',  icon: '◫' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
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
          <span className={styles.icon} aria-hidden>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
