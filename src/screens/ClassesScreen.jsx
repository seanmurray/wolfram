import { useEffect, useState } from 'react';
import styles from './ClassesScreen.module.css';
import chips from '../components/Buckets.module.css';
import { useClassStore } from '../stores/classStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useImportStore } from '../stores/importStore';
import { FORMATS, FORMAT_ORDER, classifyClass } from '../lib/classify.js';
import { WEEKDAYS, WEEKDAYS_LONG, formatTime } from '../lib/week.js';
import { studioLabel, linkSavePlan } from '../lib/classpass.js';
import { readClasses, textToLines } from '../lib/readClass.js';
import { canReadScreenshots, readScreenshot } from '../lib/classReader.js';
import { MyStudios } from '../components/MyStudios';

// `source` and `read` say where the fields came from when a screenshot,
// share or paste filled them; `link`, `studioName` and `town` ride along so a
// ClassPass link can be saved with the studio. Only the class fields are saved.
const BLANK = {
  name: '', studio: '', weekday: 0, time: '18:00', format: null,
  source: null, read: [], link: null, studioName: '', town: '',
};

const SOURCE = { screenshot: 'your screenshot', share: 'what you shared', paste: 'what you pasted' };

// A reading's class as form fields, plus which ones it filled.
function fromReading(c) {
  if (!c) return {};
  const patch = { read: [] };
  if (c.name) { patch.name = c.name; patch.format = null; patch.read.push('name'); }
  if (c.studio) {
    Object.assign(patch, { studio: c.studio, studioName: c.studioName, town: c.town });
    patch.read.push('studio');
  }
  if (c.weekday != null) { patch.weekday = c.weekday; patch.read.push('weekday'); }
  if (c.time) { patch.time = c.time; patch.read.push('time'); }
  return patch;
}

// A link names a studio at most, never the class. Where the app can read
// screenshots, send the user there: a screenshot is what the tester asked for.
const linkOnlyNotice = () => (canReadScreenshots()
  ? 'A ClassPass link names the studio, not the class. Share a screenshot of the class page instead, or fill it in below.'
  : 'That link doesn’t say which class or when. Fill those in below.');

// One class fills the form; several go to a list to tick; none says so and
// leaves the form as it was. A link with no class fills in the studio its
// share message named, if any.
function applyReading({ classes, link, studio }, source, { setForm, setFound, setNotice }) {
  if (classes.length > 1) {
    setForm(null);
    setNotice(null);
    setFound({ classes: classes.map((c) => ({ ...c, on: false })), link, source });
    return;
  }
  const [c] = classes;
  if (!c && !link) {
    setNotice(`Couldn’t find a class in ${source === 'paste' ? 'that text' : 'that screenshot'}. Fill it in below.`);
    setForm((f) => (f?.id === 'new' ? f : { id: 'new', draft: BLANK }));
    return;
  }
  setNotice(c ? null : linkOnlyNotice());
  setFound(null);
  setForm((f) => {
    const base = f?.id === 'new' ? f.draft : BLANK;
    return { id: 'new', draft: { ...base, ...fromReading(c ?? studio), source, link: link ?? base.link } };
  });
}

function linkNote(plan, draft, studios) {
  switch (plan.action) {
    case 'set': return 'The ClassPass link will be saved with this studio in Your studios.';
    case 'kept': return `${studios.find((s) => s.id === plan.id)?.name ?? 'This studio'} already has a ClassPass link, so that one stays.`;
    case 'same': return 'This studio already has this ClassPass link.';
    case 'add': return `Adds ${plan.studio.name} to Your studios, with the ClassPass link.`;
    case 'needStudio': return draft.link ? 'Add the studio’s name to keep the ClassPass link with it.' : null;
    default: return null;
  }
}

// The class library: the recurring classes the user takes or could take.
// Entered once; the Today planner reads it every week.
export function ClassesScreen() {
  const library = useClassStore((s) => s.library);
  const addClass = useClassStore((s) => s.addClass);
  const updateClass = useClassStore((s) => s.updateClass);
  const removeClass = useClassStore((s) => s.removeClass);
  const studios = useClassStore((s) => s.studios);
  const addStudio = useClassStore((s) => s.addStudio);
  const updateStudio = useClassStore((s) => s.updateStudio);
  const lowBoneDensity = useSettingsStore((s) => s.lowBoneDensity);

  const [form, setForm] = useState(null); // null | { id: 'new' | class id, draft }
  const [found, setFound] = useState(null); // null | { classes: [{ ...c, on }], link, source }
  const [notice, setNotice] = useState(null);
  const [reading, setReading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const setters = { setForm, setFound, setNotice };

  // What was shared to Wolfram arrives through the import store (App.jsx).
  useEffect(() => useImportStore.subscribe((s) => {
    if (!s.pending) return;
    const p = useImportStore.getState().take();
    if (p) applyReading(p, p.source, { setForm, setFound, setNotice });
  }), []);

  const open = (c) => {
    setNotice(null);
    setForm(c ? { id: c.id, draft: { ...BLANK, ...c } } : { id: 'new', draft: BLANK });
  };
  const close = () => { setForm(null); setNotice(null); };
  const setDraft = (fn) => setForm((f) => (f ? { ...f, draft: fn(f.draft) } : f));

  const draft = form?.draft ?? BLANK;
  // Until the user picks a format, follow the name.
  const format = draft.format ?? classifyClass(draft.name);
  const canSave = draft.name.trim() && draft.time;
  const plan = linkSavePlan(studios, draft, draft.link);

  const keepLink = (p, link) => {
    if (p.action === 'set') updateStudio(p.id, { link });
    if (p.action === 'add') addStudio(p.studio);
  };

  const save = () => {
    if (!canSave) return;
    const c = { name: draft.name.trim(), studio: draft.studio.trim(), weekday: draft.weekday, time: draft.time, format };
    if (form.id === 'new') addClass(c); else updateClass(form.id, c);
    keepLink(plan, draft.link);
    close();
  };

  const fromScreenshot = async () => {
    setReading(true);
    try {
      const lines = await readScreenshot();
      if (lines) applyReading(readClasses(lines, { studios }), 'screenshot', setters);
    } catch {
      setNotice('Couldn’t read that screenshot. Fill it in below.');
    } finally {
      setReading(false);
    }
  };
  const fromPaste = (text) => applyReading(readClasses(textToLines(text), { studios }), 'paste', setters);

  // From the found list: open one in the form (it leaves the list), or add
  // the ticked ones as read.
  const editFound = (i) => {
    const c = found.classes[i];
    const rest = found.classes.filter((_, j) => j !== i);
    setFound(rest.length ? { ...found, classes: rest } : null);
    setNotice(null);
    setForm({ id: 'new', draft: { ...BLANK, ...fromReading(c), source: found.source, link: found.link } });
  };
  const addFound = () => {
    const picked = found.classes.filter((c) => c.on && foundReady(c));
    for (const c of picked) {
      addClass({ name: c.name, studio: c.studio, weekday: c.weekday, time: c.time, format: classifyClass(c.name) });
    }
    const first = picked.find((c) => c.studio);
    if (first) keepLink(linkSavePlan(studios, first, found.link), found.link);
    setFound(null);
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

      {form ? (
        <ClassForm
          draft={draft}
          setDraft={setDraft}
          studios={studios}
          format={format}
          isNew={form.id === 'new'}
          canSave={!!canSave}
          onSave={save}
          onCancel={close}
          notice={notice}
          linkNote={linkNote(plan, draft, studios)}
          canRead={canReadScreenshots()}
          reading={reading}
          onScreenshot={fromScreenshot}
          onPaste={fromPaste}
        />
      ) : (
        <button type="button" className={styles.addBtn} onClick={() => open(null)}>+ Add a class</button>
      )}

      {found && (
        <FoundClasses
          found={found}
          onToggle={(i) => setFound({ ...found, classes: found.classes.map((c, j) => (j === i ? { ...c, on: !c.on } : c)) })}
          onEdit={editFound}
          onAdd={addFound}
          onCancel={() => setFound(null)}
        />
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

      <MyStudios />

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

// Screenshot (iPhone app) or paste, above a new class's fields.
function ImportBox({ canRead, reading, onScreenshot, onPaste }) {
  const [text, setText] = useState('');
  return (
    <div className={styles.importBox}>
      {canRead && (
        <button type="button" className={styles.importBtn} onClick={onScreenshot} disabled={reading}>
          {reading ? 'Reading…' : 'From a screenshot'}
        </button>
      )}
      <details className={styles.paste}>
        <summary>Paste from ClassPass</summary>
        <textarea
          className={styles.pasteInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Text you copied from a ClassPass screenshot, or a ClassPass link"
          rows={4}
        />
        <button
          type="button"
          className={styles.fillBtn}
          disabled={!text.trim()}
          onClick={() => { onPaste(text); setText(''); }}
        >
          Fill in
        </button>
      </details>
      <p className={styles.importTip}>
        Screenshot the class page before you scroll, so the class name is in
        the picture. You can also share a screenshot to Wolfram from the
        share sheet.
      </p>
    </div>
  );
}

function ReadMark({ draft, field }) {
  if (!draft.source || !draft.read.includes(field)) return null;
  return <span className={styles.readMark}> · from {SOURCE[draft.source]}</span>;
}

function ClassForm({
  draft, setDraft, studios, format, isNew, canSave, onSave, onCancel,
  notice, linkNote, canRead, reading, onScreenshot, onPaste,
}) {
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <div className={styles.form}>
      {isNew && <ImportBox canRead={canRead} reading={reading} onScreenshot={onScreenshot} onPaste={onPaste} />}
      {notice && <div className={styles.notice} role="status">{notice}</div>}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Class name<ReadMark draft={draft} field="name" /></span>
        <input
          className={styles.input}
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Barbell Strength"
        />
      </label>
      {/* A notice (a link with no class) already says the name is missing. */}
      {draft.source && !draft.read.includes('name') && !notice && (
        <div className={styles.hint}>
          {draft.source === 'paste'
            ? 'No class name in what you pasted. Type it in.'
            : 'The class name wasn’t in the screenshot (it slides under the clock once the page scrolls). Type it in, or screenshot the top of the class page.'}
        </div>
      )}
      <label className={styles.field}>
        <span className={styles.fieldLabel}>
          Studio <span className={styles.optional}>(optional)</span><ReadMark draft={draft} field="studio" />
        </span>
        <input
          className={styles.input}
          value={draft.studio}
          onChange={(e) => set({ studio: e.target.value })}
          placeholder="e.g. the studio on Main St"
        />
      </label>
      {studios.length > 0 && (
        <div className={chips.row}>
          {studios.map((st) => {
            const label = studioLabel(st);
            return (
              <button
                key={st.id}
                type="button"
                className={`${chips.pick} ${draft.studio === label ? chips.on : ''}`}
                onClick={() => set({ studio: label })}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {linkNote && <div className={styles.linkNote}>{linkNote}</div>}

      <div className={styles.fieldLabel}>Day<ReadMark draft={draft} field="weekday" /></div>
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
        <span className={styles.fieldLabel}>Time<ReadMark draft={draft} field="time" /></span>
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

// Several classes from one reading (a schedule, or a few screenshots shared
// at once). Nothing is ticked to start; a class with no name has to be
// opened and named first.
// A found class can be ticked once it has a name, day and time; otherwise
// it's opened in the form to fill in what wasn't read.
const foundReady = (c) => Boolean(c.name) && c.weekday != null && Boolean(c.time);

function unread(c) {
  const gaps = [!c.name && 'name', c.weekday == null && 'day', !c.time && 'time'].filter(Boolean);
  return gaps.length ? `Open it to add the ${gaps.join(' and ')}.` : null;
}

function FoundClasses({ found, onToggle, onEdit, onAdd, onCancel }) {
  const n = found.classes.filter((c) => c.on && foundReady(c)).length;
  return (
    <section className={styles.found} aria-label="Classes found">
      <div className={styles.foundTitle}>Found {found.classes.length} classes</div>
      <p className={styles.importTip}>Tick the ones you take. Open one to fix it first.</p>
      {found.classes.map((c, i) => (
        <div key={i} className={styles.row}>
          <input
            type="checkbox"
            className={styles.tick}
            checked={c.on && foundReady(c)}
            disabled={!foundReady(c)}
            onChange={() => onToggle(i)}
            aria-label={foundReady(c) ? `Add ${c.name}` : `${c.name || 'This class'}: ${unread(c)}`}
          />
          <div className={styles.time}>{c.time ? formatTime(c.time) : '—'}</div>
          <div className={styles.main}>
            <div className={styles.name}>{c.name || 'No name read'}</div>
            <div className={styles.studio}>
              {[c.weekday != null ? WEEKDAYS_LONG[c.weekday] : null, c.studio].filter(Boolean).join(' · ')}
            </div>
            {unread(c) && <div className={styles.hint}>{unread(c)}</div>}
          </div>
          <div className={styles.rowBtns}>
            <button type="button" className={styles.rowBtn} onClick={() => onEdit(i)}>Open</button>
          </div>
        </div>
      ))}
      <div className={styles.formBtns}>
        <button type="button" className={styles.cancel} onClick={onCancel}>Cancel</button>
        <button type="button" className={styles.save} onClick={onAdd} disabled={n === 0}>
          {n === 1 ? 'Add 1 class' : `Add ${n} classes`}
        </button>
      </div>
    </section>
  );
}
