import { useState } from 'react';
import styles from './HistoryScreen.module.css';
import { useSessions, useDeleteSession } from '../hooks/useSessions';
import chips from '../components/Buckets.module.css';
import { formatDate } from '../lib/dateFormat.js';
import { BUCKET_LABEL } from '../lib/labels.js';

// Where a session came from, as a short kicker above its name.
const KIND_LABEL = { gym: 'Home gym', impact: 'Impact', class: 'Class' };

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
          <div className={styles.emptyText}>
            Nothing here yet. Log a class or start a session, and it’ll show up
            here with what it counted toward.
          </div>
        </div>
      )}

      {rows.map((s) => (
        <div key={s.id} className={styles.card}>
          <div className={styles.mid}>
            {KIND_LABEL[s.kind] && <div className={styles.kind}>{KIND_LABEL[s.kind]}</div>}
            <div className={styles.title}>{s.day_label}</div>
            <div className={styles.meta}>
              {formatDate(s.performed_at)}
              {s.studio && ` · ${s.studio}`}
              {s.sets_logged > 0 && ` · ${s.sets_logged} set${s.sets_logged === 1 ? '' : 's'}`}
              {s.session_rpe != null && ` · effort ${s.session_rpe}`}
            </div>
            <div className={`${chips.row} ${styles.counted}`}>
              {(s.buckets ?? []).length === 0
                ? <span className={styles.noCredit}>Didn’t count toward the week</span>
                : s.buckets.map((b) => (
                  <span key={b} className={`${chips.chip} ${chips[b]}`}>{BUCKET_LABEL[b]}</span>
                ))}
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
