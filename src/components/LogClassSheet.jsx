import { useEffect, useState } from 'react';
import styles from './LogClassSheet.module.css';
import chips from './Buckets.module.css';
import { useClassStore } from '../stores/classStore';
import { FORMATS, FORMAT_ORDER, classifyClass, bucketsFor } from '../lib/classify.js';
import { WEEKDAYS, weekdayIndex, dateInWeek, formatTime } from '../lib/week.js';
import { BUCKET_LABEL } from '../lib/labels.js';

// Log a class in a few taps: which class, which day, and, for formats that
// can be heavy, whether it actually was. That last answer decides whether the
// class counts as Heavy, so it's asked every time rather than assumed.
//
// open, initialClassId (preselect from the Today suggestion), onCancel,
// onSave(payload for localdb.saveSession)
export function LogClassSheet({ open, initialClassId = null, onCancel, onSave }) {
  const library = useClassStore((s) => s.library);
  const now = new Date();
  const today = weekdayIndex(now);

  const [choice, setChoice] = useState(null);       // class id | 'other'
  const [otherName, setOtherName] = useState('');
  const [otherFormat, setOtherFormat] = useState(null); // null = follow the name
  const [day, setDay] = useState(today);
  const [wentHeavy, setWentHeavy] = useState(null);

  // Fresh state on every open.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      const pre = library.find((c) => c.id === initialClassId);
      setChoice(pre ? pre.id : library.length ? null : 'other');
      setOtherName('');
      setOtherFormat(null);
      setDay(pre && pre.weekday <= today ? pre.weekday : today);
      setWentHeavy(null);
    }
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const cls = library.find((c) => c.id === choice) ?? null;
  const isOther = choice === 'other';
  const format = cls ? cls.format : isOther ? (otherFormat ?? classifyClass(otherName)) : null;
  const heavyEligible = format ? FORMATS[format].heavyEligible : false;
  const name = cls ? cls.name : otherName.trim();

  const ready = !!format && !!name && (!heavyEligible || wentHeavy !== null);
  const buckets = format ? bucketsFor(format, wentHeavy === true) : [];

  // Library classes are timestamped at their scheduled time on the chosen day
  // (never in the future); one-offs at now today, or midday on earlier days.
  const performedAt = () => {
    if (cls) {
      const at = dateInWeek(now, day, cls.time);
      return (at > now ? now : at).toISOString();
    }
    return (day === today ? now : dateInWeek(now, day, '12:00')).toISOString();
  };

  const save = () => {
    if (!ready) return;
    onSave({
      kind: 'class',
      dayLabel: name,
      studio: cls?.studio || null,
      classId: cls?.id ?? null,
      format,
      wentHeavy: heavyEligible ? wentHeavy : null,
      buckets,
      performedAt: performedAt(),
    });
  };

  // Today's library classes first, then the rest of the week in day order.
  const sorted = [...library].sort((a, b) =>
    (a.weekday === today ? -1 : 0) - (b.weekday === today ? -1 : 0) ||
    a.weekday - b.weekday || a.time.localeCompare(b.time));

  return (
    <>
      <div className={`${styles.overlay} ${open ? styles.open : ''}`} onClick={onCancel} aria-hidden />
      <div className={`${styles.sheet} ${open ? styles.open : ''}`} role="dialog" aria-modal="true" aria-label="Log a class">
        <div className={styles.handle} />
        <div className={styles.header}>
          <div className={styles.title}>Log a class</div>
        </div>

        <div className={styles.body}>
          <div className={styles.q}>Which class?</div>
          <div className={styles.options}>
            {sorted.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.option} ${choice === c.id ? styles.on : ''}`}
                onClick={() => { setChoice(c.id); setWentHeavy(null); if (c.weekday <= today) setDay(c.weekday); }}
              >
                <span className={styles.optName}>{c.name}</span>
                <span className={styles.optMeta}>
                  {WEEKDAYS[c.weekday]} {formatTime(c.time)}{c.studio ? ` · ${c.studio}` : ''}
                </span>
              </button>
            ))}
            <button
              type="button"
              className={`${styles.option} ${isOther ? styles.on : ''}`}
              onClick={() => { setChoice('other'); setWentHeavy(null); }}
            >
              <span className={styles.optName}>Something else</span>
              <span className={styles.optMeta}>A one-off class or a drop-in</span>
            </button>
          </div>

          {isOther && (
            <>
              <input
                className={styles.input}
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="Class name, e.g. Barbell Basics"
                aria-label="Class name"
              />
              <div className={styles.q}>What kind of class?</div>
              <div className={chips.row}>
                {FORMAT_ORDER.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${chips.pick} ${format === f ? chips.on : ''}`}
                    onClick={() => { setOtherFormat(f); setWentHeavy(null); }}
                  >
                    {FORMATS[f].label}
                  </button>
                ))}
              </div>
              {format && <div className={styles.hint}>{FORMATS[format].hint}</div>}
            </>
          )}

          <div className={styles.q}>When?</div>
          <div className={chips.row}>
            {WEEKDAYS.slice(0, today + 1).map((label, i) => (
              <button
                key={label}
                type="button"
                className={`${chips.pick} ${day === i ? chips.on : ''}`}
                onClick={() => setDay(i)}
              >
                {i === today ? 'Today' : label}
              </button>
            ))}
          </div>

          {heavyEligible && (
            <>
              <div className={styles.q}>Did you go heavy?</div>
              <div className={styles.hint}>
                Heavy means sets of eight or fewer where the last couple of reps
                were a real fight. Light dumbbells for lots of reps is great work,
                just not heavy.
              </div>
              <div className={styles.yesNo}>
                <button
                  type="button"
                  className={`${chips.pick} ${wentHeavy === true ? chips.on : ''}`}
                  onClick={() => setWentHeavy(true)}
                >
                  Yes, it was heavy
                </button>
                <button
                  type="button"
                  className={`${chips.pick} ${wentHeavy === false ? chips.on : ''}`}
                  onClick={() => setWentHeavy(false)}
                >
                  Not really
                </button>
              </div>
            </>
          )}

          {format && (!heavyEligible || wentHeavy !== null) && (
            <div className={styles.counts}>
              Counts as{' '}
              {buckets.map((b) => (
                <span key={b} className={`${chips.chip} ${chips[b]}`}>{BUCKET_LABEL[b]}</span>
              ))}
              {buckets.includes('cardio') && <span className={styles.countsNote}>Good for your heart; no bone credit.</span>}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={onCancel}>Cancel</button>
            <button type="button" className={styles.cta} onClick={save} disabled={!ready}>Save</button>
          </div>
        </div>
      </div>
    </>
  );
}
