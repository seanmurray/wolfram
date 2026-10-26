import { useState } from 'react';
import styles from './HistoryScreen.module.css';
import { useSessions, useDeleteSession } from '../hooks/useSessions';
import { DAYS } from '../data/program';
import { formatDate } from '../lib/dateFormat';

const DAY_EMOJI = { a: '🏋️', b: '🌿', move: '🚶' };

export function HistoryScreen() {
  const { data: sessions, isLoading } = useSessions();
  const deleteMutation = useDeleteSession();
  const [pendingDelete, setPendingDelete] = useState(null);

  if (isLoading) {
    return (
      <main className="screen">
        <div className="title-xl">History</div>
      </main>
    );
  }

  const rows = sessions ?? [];

  return (
    <main className="screen">
      <div className="overline">Every session counts</div>
      <div className="title-xl">History</div>

      {rows.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🌱</div>
          <div className={styles.emptyText}>
            Nothing here yet — your first session will be. That's the fun part.
          </div>
        </div>
      )}

      {rows.map((s) => (
        <div key={s.id} className={styles.card}>
          <span className={styles.emoji}>{DAY_EMOJI[s.day_id] ?? '💪'}</span>
          <div className={styles.mid}>
            <div className={styles.title}>{DAYS[s.day_id]?.name ?? s.day_label}</div>
            <div className={styles.meta}>
              {formatDate(s.performed_at)}
              {s.sets_logged > 0 && ` · ${s.sets_logged} sets`}
              {s.perf_logged > 0 && ` · moved`}
              {s.session_rpe != null && ` · effort ${s.session_rpe}`}
            </div>
          </div>
          {pendingDelete === s.id ? (
            <div className={styles.confirmRow}>
              <button
                type="button"
                className={styles.confirmDelete}
                onClick={() => { deleteMutation.mutate(s.id); setPendingDelete(null); }}
              >
                Delete
              </button>
              <button type="button" className={styles.cancelDelete} onClick={() => setPendingDelete(null)}>
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => setPendingDelete(s.id)}
              aria-label="Delete session"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </main>
  );
}
