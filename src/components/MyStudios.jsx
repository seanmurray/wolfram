import { useState } from 'react';
import styles from '../screens/ClassesScreen.module.css';
import own from './MyStudios.module.css';
import { useClassStore } from '../stores/classStore';
import { FindClassLink } from './FindClassLink';
import { parseClassPassLink, studioHandoff } from '../lib/classpass.js';

const BLANK = { name: '', town: '', link: '' };

// The studios the user likes. Each one is a quick pick when adding a class
// and a one-tap way into ClassPass to find its next class.
export function MyStudios() {
  const studios = useClassStore((s) => s.studios);
  const addStudio = useClassStore((s) => s.addStudio);
  const updateStudio = useClassStore((s) => s.updateStudio);
  const removeStudio = useClassStore((s) => s.removeStudio);

  const [editing, setEditing] = useState(null); // null | 'new' | studio id
  const [draft, setDraft] = useState(BLANK);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const open = (st) => {
    setEditing(st ? st.id : 'new');
    setDraft(st ? { name: st.name, town: st.town ?? '', link: st.link ?? '' } : BLANK);
  };
  const close = () => { setEditing(null); setDraft(BLANK); };
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const link = parseClassPassLink(draft.link);
  const badLink = draft.link.trim() !== '' && !link;
  const canSave = draft.name.trim() && !badLink;

  const save = () => {
    if (!canSave) return;
    const st = { name: draft.name.trim(), town: draft.town.trim(), link };
    if (editing === 'new') addStudio(st); else updateStudio(editing, st);
    close();
  };

  return (
    <section className={own.section} aria-label="Your studios">
      <div className={own.title}>Your studios</div>
      <p className={own.intro}>
        The studios you like. They’re quick picks when you add a class, and
        “Find a class” takes you to them in ClassPass.
      </p>

      {studios.map((st) =>
        editing === st.id ? null : (
          <div key={st.id} className={styles.row}>
            <div className={styles.main}>
              <div className={styles.name}>{st.name}</div>
              {st.town && <div className={styles.studio}>{st.town}</div>}
              <FindClassLink {...studioHandoff(st)}>Find a class</FindClassLink>
            </div>
            {confirmRemove === st.id ? (
              <div className={styles.rowBtns}>
                <button type="button" className={styles.removeConfirm} onClick={() => { removeStudio(st.id); setConfirmRemove(null); }}>Remove</button>
                <button type="button" className={styles.rowBtn} onClick={() => setConfirmRemove(null)}>Keep</button>
              </div>
            ) : (
              <div className={styles.rowBtns}>
                <button type="button" className={styles.rowBtn} onClick={() => open(st)}>Edit</button>
                <button type="button" className={styles.rowBtn} onClick={() => setConfirmRemove(st.id)} aria-label={`Remove ${st.name}`}>Remove</button>
              </div>
            )}
          </div>
        ))}

      {editing ? (
        <div className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Studio</span>
            <input className={styles.input} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. the yoga studio" />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Town <span className={styles.optional}>(optional)</span></span>
            <input className={styles.input} value={draft.town} onChange={(e) => set({ town: e.target.value })} placeholder="Handy if it has more than one" />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>ClassPass link <span className={styles.optional}>(optional)</span></span>
            <input
              className={styles.input}
              value={draft.link}
              onChange={(e) => set({ link: e.target.value })}
              placeholder="Paste the studio’s link"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>
          <div className={styles.formatHint}>
            {badLink
              ? 'That isn’t a ClassPass link. Leave it empty if you don’t have one.'
              : 'In ClassPass, open the studio, tap Share, then Copy link. Without a link, “Find a class” opens ClassPass search and copies the studio’s name for you to paste.'}
          </div>
          <div className={styles.formBtns}>
            <button type="button" className={styles.cancel} onClick={close}>Cancel</button>
            <button type="button" className={styles.save} onClick={save} disabled={!canSave}>
              {editing === 'new' ? 'Add studio' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.addBtn} onClick={() => open(null)}>+ Add a studio</button>
      )}
    </section>
  );
}
