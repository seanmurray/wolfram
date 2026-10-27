import { useState } from 'react';
import styles from './ClassesScreen.module.css';
import chips from '../components/Buckets.module.css';
import { useClassStore } from '../stores/classStore';
import { useSettingsStore } from '../stores/settingsStore';
import { FORMATS, FORMAT_ORDER, classifyClass } from '../lib/classify.js';
import { WEEKDAYS, WEEKDAYS_LONG, formatTime } from '../lib/week.js';

const BLANK = { name: '', studio: '', weekday: 0, time: '18:00', format: null };

// The class library: the recurring classes the user takes or could take.
// Entered once; the Today planner reads it every week.
export function ClassesScreen() {
  const library = useClassStore((s) => s.library);
  const addClass = useClassStore((s) => s.addClass);
  const updateClass = useClassStore((s) => s.updateClass);
  const removeClass = useClassStore((s) => s.removeClass);
  const lowBoneDensity = useSettingsStore((s) => s.lowBoneDensity);

  const [editing, setEditing] = useState(null); // null | 'new' | class id
  const [draft, setDraft] = useState(BLANK);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const open = (c) => {
    setEditing(c ? c.id : 'new');
    setDraft(c ? { ...c } : BLANK);
  };
  const close = () => { setEditing(null); setDraft(BLANK); };

  // Until the user picks a format, follow the name.
  const format = draft.format ?? classifyClass(draft.name);
  const canSave = draft.name.trim() && draft.time;

  const save = () => {
    if (!canSave) return;
    const c = { name: draft.name.trim(), studio: draft.studio.trim(), weekday: draft.weekday, time: draft.time, format };
    if (editing === 'new') addClass(c); else updateClass(editing, c);
    close();
  };

  const byDay = WEEKDAYS.map((_, d) =>
    library.filter((c) => c.weekday === d).sort((a, b) => a.time.localeCompare(b.time)));

  return (
    <main className="screen">
      <div className="overline">Your schedule</div>
      <div className="title-xl">Classes</div>
      <p className={styles.intro}>
        Add the classes you take, or could take, each week. Wolfram uses this
        list to tell you which ones to book so they cover your heavy and
        impact days.
      </p>
      {lowBoneDensity && (
        <div className={styles.spineNote}>
          <div className={styles.spineTitle}>In class: keep your spine long</div>
          UK osteoporosis guidance advises modifying moves that round the spine
          hard, repeatedly, or under load, and links some to spine fractures:
          roll-ups, crunches and sit-ups, the plough, and deep seated forward
          folds. Ask the teacher for a flat-back version. Twisting is fine if
          it’s smooth and comfortable.
        </div>
      )}

      {editing ? (
        <ClassForm
          draft={draft}
          setDraft={setDraft}
          format={format}
          isNew={editing === 'new'}
          canSave={!!canSave}
          onSave={save}
          onCancel={close}
        />
      ) : (
        <button type="button" className={styles.addBtn} onClick={() => open(null)}>+ Add a class</button>
      )}

      {library.length > 0 && (
        <div className={styles.list}>
          {byDay.map((classes, d) =>
            classes.length === 0 ? null : (
              <section key={d} className={styles.day}>
                <div className={styles.dayLabel}>{WEEKDAYS_LONG[d]}</div>
                {classes.map((c) => (
                  <div key={c.id} className={styles.row}>
                    <div className={styles.time}>{formatTime(c.time)}</div>
                    <div className={styles.main}>
                      <div className={styles.name}>{c.name}</div>
                      {c.studio && <div className={styles.studio}>{c.studio}</div>}
                      <span className={`${chips.chip} ${chips[c.format]}`}>{FORMATS[c.format]?.label}</span>
                    </div>
                    {confirmRemove === c.id ? (
                      <div className={styles.rowBtns}>
                        <button type="button" className={styles.removeConfirm} onClick={() => { removeClass(c.id); setConfirmRemove(null); }}>Remove</button>
                        <button type="button" className={styles.rowBtn} onClick={() => setConfirmRemove(null)}>Keep</button>
                      </div>
                    ) : (
                      <div className={styles.rowBtns}>
                        <button type="button" className={styles.rowBtn} onClick={() => open(c)}>Edit</button>
                        <button type="button" className={styles.rowBtn} onClick={() => setConfirmRemove(c.id)} aria-label={`Remove ${c.name}`}>Remove</button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ))}
        </div>
      )}

      <section className={styles.guide}>
        <div className={styles.guideTitle}>Finding the right classes on ClassPass</div>
        <p>
          <strong>For heavy days</strong>, search <em>barbell</em>,{' '}
          <em>lifting</em>, <em>powerlifting</em> or <em>strength</em>, then
          read the description. You want “barbell”, “heavy” or “low reps”.
        </p>
        <p>
          <strong>For impact</strong>, look for <em>bootcamp</em>,{' '}
          <em>HIIT</em>, <em>plyo</em> or <em>jump rope</em>: anything with
          jumping in it.
        </p>
        <p>
          <strong>Sculpt, tone, barre and pump</strong> classes use light
          weights for lots of reps. They’re good for muscle endurance and
          balance, but not the loading bone responds to. Enjoy them as studio
          days.
        </p>
      </section>
    </main>
  );
}

function ClassForm({ draft, setDraft, format, isNew, canSave, onSave, onCancel }) {
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <div className={styles.form}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Class name</span>
        <input
          className={styles.input}
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Barbell Strength"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Studio <span className={styles.optional}>(optional)</span></span>
        <input
          className={styles.input}
          value={draft.studio}
          onChange={(e) => set({ studio: e.target.value })}
          placeholder="e.g. the studio on Main St"
        />
      </label>

      <div className={styles.fieldLabel}>Day</div>
      <div className={chips.row}>
        {WEEKDAYS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`${chips.pick} ${draft.weekday === i ? chips.on : ''}`}
            onClick={() => set({ weekday: i })}
          >
            {label}
          </button>
        ))}
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Time</span>
        <input
          type="time"
          className={`${styles.input} ${styles.timeInput}`}
          value={draft.time}
          onChange={(e) => set({ time: e.target.value })}
        />
      </label>

      <div className={styles.fieldLabel}>
        What kind of class?
        {draft.format == null && draft.name.trim() && <span className={styles.guess}> · our guess from the name</span>}
      </div>
      <div className={chips.row}>
        {FORMAT_ORDER.map((f) => (
          <button
            key={f}
            type="button"
            className={`${chips.pick} ${format === f ? chips.on : ''}`}
            onClick={() => set({ format: f })}
          >
            {FORMATS[f].label}
          </button>
        ))}
      </div>
      <div className={styles.formatHint}>{FORMATS[format].hint}</div>

      <div className={styles.formBtns}>
        <button type="button" className={styles.cancel} onClick={onCancel}>Cancel</button>
        <button type="button" className={styles.save} onClick={onSave} disabled={!canSave}>
          {isNew ? 'Add class' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
