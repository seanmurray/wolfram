import { useState } from 'react';
import styles from './FindClassLink.module.css';
import { copyForSearch } from '../lib/classpass.js';

// A link out to ClassPass. When there's no page to open straight to, the
// search words go on the clipboard and a line says to paste them.
export function FindClassLink({ href, copy, children, variant = 'button' }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    if (!copy) return;
    copyForSearch(copy);
    setCopied(true);
  };
  return (
    <span className={styles.wrap}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={variant === 'button' ? styles.button : styles.small}
        onClick={onClick}
      >
        {children}
      </a>
      {copied && (
        <span className={styles.copied} role="status">
          Copied “{copy}”. Paste it into ClassPass search.
        </span>
      )}
    </span>
  );
}
