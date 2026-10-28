import styles from './AppHeader.module.css';

// Brand lockup at the top of the app: the mark and the wordmark on one line.
// Both assets carry the artwork's cream background, which is exactly --bg, so
// they sit flush on the page with no cutout needed.
export function AppHeader() {
  const base = import.meta.env.BASE_URL;
  return (
    <>
      <div className={styles.statusScrim} aria-hidden="true" />
      <header className={styles.header}>
        <img src={`${base}icon-192.png`} alt="" className={styles.mark} />
        <span className={styles.wordmark}>Wolfram</span>
      </header>
    </>
  );
}
