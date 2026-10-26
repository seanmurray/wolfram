import { useState } from 'react';
import styles from './ExerciseNote.module.css';
import { useExerciseNote } from '../hooks/useExerciseNotes';

// Persistent form-cue note for an exercise — shows up every time this
// exercise appears so cues you discover for yourself ("lean farther on
// falling starts", "shoulder retraction on bench") stay sticky.
export function ExerciseNote({ exerciseKey, exerciseName }) {
  const { note, save, isSaving } = useExerciseNote(exerciseKey, exerciseName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const onEdit = () => {
    setDraft(note);
    setEditing(true);
  };

  const onSave = () => {
    save(draft.trim(), {
      onSuccess: () => setEditing(false),
    });
  };

  const onCancel = () => {
    setEditing(false);
    setDraft('');
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.label}>Form cue</div>
        {!editing && (
          <button type="button" className={styles.editBtn} onClick={onEdit}>
            {note ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            className={styles.editor}
            placeholder="e.g. Lean farther — must catch yourself"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
            <button type="button" className={styles.save} onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      ) : note ? (
        <div className={styles.text}>{note}</div>
      ) : (
        <div className={styles.empty}>No form cue yet — tap Add to remember one for next time.</div>
      )}
    </div>
  );
}
