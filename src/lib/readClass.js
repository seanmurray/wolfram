// Reading a class out of a ClassPass screenshot or pasted text, so the user
// can skip typing it in (docs/specs/class-from-screenshot.md). Nothing is
// fetched: this only reads the words it's given.
//
// Input is lines as the phone's text reader returns them,
// [{ text, x, y, w, h }] with positions 0–1 from the top-left, or pasted
// text through textToLines() (no positions; line order stands in for y).
//
// Built against real class-page screenshots (kept outside the repo). What
// they showed:
//   - The date line is the anchor: "Wed, Nov 4 · 6:00 PM – 7:00 PM". It
//     reads back as "wed, Nov4-6:OO PM -7:00 PM" (the dot as a dash, zeros as
//     O), and the back button can hide the weekday's first letter, so the day
//     comes from the date and the word is only a fallback.
//   - Above it, in order: the class name (big), "<studio> • <town> >" (the
//     back button can hide its first word), a category, "100+ bookings this
//     week". Below it: the teacher's name.
//   - Scroll the page a little and the class name slides under the status
//     bar, leaving just the clock. Then the name is left blank, not guessed.
//   - From the Saved / Share / Add row down it's the description and reviews,
//     and reviews name other classes, so none of that is read.
//
// And a real studio-schedule screenshot:
//   - At the top, the studio's name over "View details >", then a row of day
//     tabs: "Today", "Thu 5", "Fri 6" …, one day apart.
//   - Then the list: a day heading on its own ("Today", "Thu 5"), and under it
//     one row per class. The time is on the left ("16:30", 24-hour on a phone
//     set that way) with the class name level with it on the right. The length
//     ("60 min") and teacher sit below those, and the credits on the far right.
//   - The text reader returns the time and the name as separate lines, and the
//     bigger name can start a hair higher, so rows are matched by their
//     middles, not by sort order.
//   - "Today" is the day the screenshot was taken, which can be days before
//     it's read, so it's worked out from the tabs next to it when they show.
//   - On a phone set to 12-hour the times read "6:00 pm", each teacher can
//     have a trial note under it, and the first two tabs can read as one line.
//
// ClassPass's own Share button, even on a class page, sends an invite
// message that names only the studio: "… check out spots like <studio> 😊
// https://classpass.com/invite/<code>?placement=VenueDetails". The code
// differs from studio to studio. So a share gives the studio and its link,
// never the class.

import { parseClassPassLink, studioLabel } from './classpass.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// Where the header ends: the action row, the plus-one banner, the sections.
const CUT = /^(saved?|share|add|details|bring a plus-one|invite a friend|reserve|ratings and reviews)\b/i;
// Header lines that are never the name or the studio.
const JUNK = /\bcredits?\b|\bbookings?\b|\bspots? left\b|\bwaitlist\b|^\W*\d{1,2}:\d{2}\W*$/i;

export function textToLines(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t, i) => ({ text: t, y: i }));
}

// The text reader mixes up O/0 and l/1 inside times ("6:OO PM").
function fixDigits(s) {
  return s.replace(/\b([0-9OoIl]{1,2})([:.])([0-9OoIl]{2})\b/g, (m, h, _sep, mm) => {
    if (!/\d/.test(m)) return m;
    const d = (x) => x.replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
    return `${d(h)}:${d(mm)}`;
  });
}

const pad = (n) => String(n).padStart(2, '0');

// 'HH:MM' for the first time in the text, or null. A range's start borrows
// the end's AM/PM ("6:00 – 7:00 PM"). A bare "11:34" with no AM/PM counts
// only when it's plainly 24-hour, since a status-bar clock looks the same.
export function readTime(text) {
  const s = fixDigits(String(text ?? ''));
  const re = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\b\.?|(\d{1,2}):(\d{2})/gi;
  const found = [];
  for (const m of s.matchAll(re)) {
    if (m[1] != null) found.push({ h: +m[1], m: +(m[2] ?? 0), mer: m[3].toLowerCase(), at: m.index, end: m.index + m[0].length });
    else found.push({ h: +m[4], m: +m[5], mer: null, at: m.index, end: m.index + m[0].length });
  }
  if (!found.length) return null;
  const [first, second] = found;
  let mer = first.mer;
  if (!mer && second?.mer && /^\s*[-–—~to]+\s*$/i.test(s.slice(first.end, second.at))) {
    // "11:30 – 12:30 PM" starts in the morning: a start can't be after its end.
    const to24 = (h, m) => ((h % 12) + (m === 'p' ? 12 : 0));
    mer = to24(first.h, second.mer) > to24(second.h, second.mer) ? (second.mer === 'p' ? 'a' : 'p') : second.mer;
  }
  let { h } = first;
  const mm = first.m;
  if (mm > 59) return null;
  if (mer) {
    if (h < 1 || h > 12) return null;
    if (mer === 'p' && h !== 12) h += 12;
    if (mer === 'a' && h === 12) h = 0;
    return `${pad(h)}:${pad(mm)}`;
  }
  // No AM/PM: only a time that can't be anything but 24-hour ("18:30",
  // "06:30"). "6:30" or "11:34" could be morning or evening.
  const written = s.slice(first.at, first.end);
  if (h <= 23 && (h >= 13 || /^0\d:/.test(written))) return `${pad(h)}:${pad(mm)}`;
  return null;
}

// Weekday (0 = Mon) for a date like "Nov 4" in the text, read as the
// occurrence nearest to now; else a weekday word; else Today/Tomorrow.
export function readWeekday(text, now = new Date()) {
  const s = String(text ?? '').toLowerCase();
  const date = s.match(new RegExp(`\\b(${MONTHS.join('|')})[a-z]*\\.?\\s*(\\d{1,2})\\b`));
  if (date) {
    const month = MONTHS.indexOf(date[1]);
    const day = +date[2];
    let best = null;
    for (const y of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
      const d = new Date(y, month, day, 12);
      if (d.getMonth() !== month) continue; // e.g. "Feb 31"
      if (!best || Math.abs(d - now) < Math.abs(best - now)) best = d;
    }
    if (best) return (best.getDay() + 6) % 7;
  }
  const word = s.match(new RegExp(`\\b(${DAYS.join('|')})[a-z]*\\b`));
  if (word) return DAYS.indexOf(word[1]);
  const today = (now.getDay() + 6) % 7;
  if (/\btoday\b/.test(s)) return today;
  if (/\btomorrow\b/.test(s)) return (today + 1) % 7;
  return null;
}

const words = (s) => String(s ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

// The saved studio this line names, if any. Short words ("by", "of") are
// ignored, and half the name is enough when the town matches too, since the
// back button can hide the first word.
export function matchStudio(text, studios = []) {
  const lw = new Set(words(text));
  let best = null;
  let bestScore = 0;
  for (const st of studios) {
    const nw = words(st.name).filter((w) => w.length > 2);
    if (!nw.length) continue;
    const hit = nw.filter((w) => lw.has(w)).length / nw.length;
    const tw = words(st.town);
    const townHit = tw.length > 0 && tw.every((w) => lw.has(w));
    if (!(hit >= 0.75 || (hit >= 0.5 && townHit))) continue;
    const score = hit + (townHit ? 0.5 : 0);
    if (score > bestScore) { best = st; bestScore = score; }
  }
  return best;
}

// "<studio> • <town> >" → { name, town }, or null if the line has no bullet.
function splitStudioLine(text) {
  const parts = text.replace(/[\s>›»]+$/, '').split(/\s+[•·]\s+/);
  if (parts.length < 2) return null;
  return { name: parts[0].trim(), town: parts.slice(1).join(' ').trim() };
}

const isDateLine = (text) => readTime(text) != null && readWeekday(text) != null;

// The studio's own fields for a line that names it: a saved studio first,
// then "<studio> • <town>", then the line as it is (`asIs`).
function studioFrom(text, studios, asIs = false) {
  const saved = matchStudio(text, studios);
  if (saved) return { studio: studioLabel(saved), studioName: saved.name, town: saved.town ?? '' };
  const split = splitStudioLine(text);
  if (split) return { studio: studioLabel(split), studioName: split.name, town: split.town };
  const name = text.replace(/[\s>›»]+$/, '').trim();
  if (asIs && name) return { studio: name, studioName: name, town: '' };
  return { studio: '', studioName: '', town: '' };
}

// The studio in ClassPass's share message, up to the emoji or the link.
const SHARED_STUDIO = /\bspots like\s+([^\n]+?)\s*(?:\p{Extended_Pictographic}|https?:\/\/|\n|$)/u;

function sharedStudio(text, studios) {
  const name = SHARED_STUDIO.exec(text)?.[1].replace(/[.!,]+$/, '').trim();
  return name ? studioFrom(name, studios, true) : null;
}

// { classes: [{ name, studio, studioName, town, weekday, time, missing }],
//   link, studio }. `studio` ({ studio, studioName, town }) is only for a
// link with no class, from the share message around it; otherwise null.
export function readClasses(lines, { now = new Date(), studios = [] } = {}) {
  const all = [...(lines ?? [])]
    .filter((l) => l && String(l.text ?? '').trim())
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));
  const text = all.map((l) => l.text).join('\n');
  const link = parseClassPassLink(text);
  const page = readClassPage(all, { now, studios });
  if (page) return { classes: [page], link, studio: null };
  const classes = readSchedule(all, { now, studios });
  return { classes, link, studio: link && !classes.length ? sharedStudio(text, studios) : null };
}

// One class's page, or null if there's no date line.
function readClassPage(all, { now, studios }) {
  const positioned = all.some((l) => l.h != null);

  // Lines before the action row, minus the clock, credits and bookings.
  const cut = all.findIndex((l) => CUT.test(l.text.trim()));
  const header = (cut === -1 ? all : all.slice(0, cut)).map((l) => ({ ...l, text: l.text.trim() }));

  const dateAt = header.findIndex((l) => isDateLine(l.text));
  if (dateAt === -1) return null;
  const dateLine = header[dateAt].text;

  // Name and studio sit above the date line.
  const above = header.slice(0, dateAt).filter((l) => !JUNK.test(l.text) && /[a-z]{3}/i.test(l.text));
  const studioAt = above.findIndex((l) => matchStudio(l.text, studios) || splitStudioLine(l.text));
  let studio = { studio: '', studioName: '', town: '' };
  let name = '';
  if (studioAt !== -1) {
    studio = studioFrom(above[studioAt].text, studios);
    // The name is above the studio: the tallest line there, else the nearest.
    const names = above.slice(0, studioAt);
    if (names.length) {
      const pick = positioned
        ? names.reduce((a, b) => ((b.h ?? 0) > (a.h ?? 0) ? b : a))
        : names[names.length - 1];
      name = pick.text.replace(/^\d{1,2}:\d{2}\s+/, ''); // clock run into the title
    }
  } else if (!positioned && above.length) {
    // Pasted text with no studio line: the first line is the best bet.
    name = above[0].text;
  }

  return draft({ name, ...studio, weekday: readWeekday(dateLine, now), time: readTime(dateLine) });
}

function draft(c) {
  return { ...c, missing: ['name', 'studio', 'weekday', 'time'].filter((k) => c[k] == null || c[k] === '') };
}

// "Today", "Tomorrow", "Thu 5", "Thursday", "Thu, Nov 5": the tabs and the
// day headings of a schedule.
// Whole words only, so "Sunset" or "Thunder" isn't a day.
const DAY_WORD = 'mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?';
const MONTH_WORD = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
const DAY_LABEL = new RegExp(
  `\\b(?:today|tomorrow|(?:${DAY_WORD})\\b\\.?(?:,?\\s*(?:${MONTH_WORD})\\b\\.?)?(?:\\s*\\d{1,2}\\b)?)`, 'gi');

// The day labels a line is made of, or null if it's anything else.
function dayLabels(text) {
  const t = text.trim();
  const found = t.match(DAY_LABEL) ?? [];
  return found.length && !t.replace(DAY_LABEL, '').trim() ? found : null;
}

// Offset from today for a relative label, or the weekday for a named one.
function labelDay(label, todayWd) {
  const s = label.toLowerCase();
  if (s.startsWith('today')) return todayWd;
  if (s.startsWith('tomorrow')) return (todayWd + 1) % 7;
  return DAYS.indexOf(s.slice(0, 3));
}

// A time at the start of a schedule row ("16:30", "6:30 PM", "6 PM"), and
// whatever follows it on the same line.
function leadingTime(text) {
  const m = fixDigits(text.trim()).match(/^(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s*m\b\.?)?\s*(.*)$/i);
  if (!m || (m[2] == null && !m[3])) return null;
  const h = +m[1];
  const mm = +(m[2] ?? 0);
  if (mm > 59) return null;
  return { h, mm, mer: m[3]?.toLowerCase() ?? null, twoDigit: m[1].length === 2, rest: m[4].trim() };
}

// Lines on a schedule row that can't be the class name.
const NOT_NAME = /^\W*\d+\W*$|^\d+\s*(?:min|mins|minutes|hr|hrs|hours?|h)\b|\bcredits?\b|\bspots? left\b|\bwaitlist\b|^view details\b|^[ap]\.?m\.?$/i;
const isName = (text) => /[a-z]{3}/i.test(text) && !NOT_NAME.test(text.trim()) && !dayLabels(text) && !leadingTime(text);

// Every class on a studio's schedule. Studio from the header, day from the
// heading above each row; a row before any heading gets no day.
function readSchedule(all, { now, studios }) {
  const positioned = all.some((l) => l.h != null);
  const mid = (l) => (l.y ?? 0) + (l.h ?? 0) / 2;
  // Below the status bar (its clock reads like a class time).
  const lines = positioned ? all.filter((l) => mid(l) >= 0.06) : all;
  const sameRow = (a, b) => positioned && Math.abs(mid(a) - mid(b)) < 0.5 * Math.max(a.h ?? 0, b.h ?? 0);

  // The tabs: three or more day labels side by side, or in a run when pasted.
  let tabs = null;
  let tabsEnd = -1;
  for (let i = 0; i < lines.length && !tabs; i++) {
    const own = dayLabels(lines[i].text);
    if (!own) continue;
    let j = i;
    const labels = [...own];
    // Pasted, the first heading comes straight after the tabs and repeats one.
    const fresh = (next) => next.every((n) => !labels.some((x) => x.toLowerCase() === n.toLowerCase()));
    while (j + 1 < lines.length && dayLabels(lines[j + 1].text) && fresh(dayLabels(lines[j + 1].text))
      && (positioned ? sameRow(lines[i], lines[j + 1]) : true)) {
      j += 1;
      labels.push(...dayLabels(lines[j].text));
    }
    if (labels.length >= 3) { tabs = labels; tabsEnd = j; }
  }

  // Today's weekday: from a named tab's place after "Today", else from now.
  let todayWd = (now.getDay() + 6) % 7;
  if (tabs) {
    const t0 = tabs.findIndex((l) => /^today/i.test(l));
    const named = tabs.findIndex((l, i) => i > t0 && labelDay(l, 0) >= 0 && !/^(today|tomorrow)/i.test(l));
    if (t0 !== -1 && named !== -1) todayWd = (((labelDay(tabs[named], 0) - (named - t0)) % 7) + 7) % 7;
  }

  // The header ends at the tabs or "View details"; the studio is the line
  // over "View details", else the first one in the header.
  const details = lines.findIndex((l) => /^view details\b/i.test(l.text.trim()));
  const headerEnd = Math.max(tabsEnd, details);
  let studio = { studio: '', studioName: '', town: '' };
  const header = lines.slice(0, details !== -1 ? details : tabsEnd + 1)
    .filter((l) => isName(l.text) && !JUNK.test(l.text));
  if (header.length) studio = studioFrom(header[details !== -1 ? header.length - 1 : 0].text, studios, true);

  const body = lines.slice(headerEnd + 1);
  const rows = [];
  let day = null;
  body.forEach((l, i) => {
    const labels = dayLabels(l.text);
    if (labels?.length === 1) { day = labelDay(labels[0], todayWd); return; }
    const t = leadingTime(l.text);
    if (!t) return;
    let name = isName(t.rest) ? t.rest : '';
    if (!name && positioned) {
      // Level with the time, to its right; the nearest one.
      const right = body.filter((o) => o !== l && sameRow(o, l) && (o.x ?? 0) > (l.x ?? 0) && isName(o.text));
      right.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      name = right[0]?.text.trim() ?? '';
    } else if (!name) {
      // Pasted: the next line that reads as a name, past a length or credits.
      for (const o of body.slice(i + 1, i + 3)) {
        if (dayLabels(o.text) || leadingTime(o.text)) break;
        if (isName(o.text)) { name = o.text.trim(); break; }
      }
    }
    // A schedule row always has a name; a time without one isn't a class.
    if (name) rows.push({ name, day, t });
  });

  // No AM/PM anywhere means the phone shows 24-hour times. With some, a bare
  // time counts only when it can't be anything but 24-hour.
  const h24 = !rows.some((r) => r.t.mer) && !body.some((l) => /^[ap]\.?m\.?$/i.test(l.text.trim()));
  const clock = ({ h, mm, mer, twoDigit }) => {
    if (mer) {
      if (h < 1 || h > 12) return null;
      return `${pad(mer === 'p' && h !== 12 ? h + 12 : mer === 'a' && h === 12 ? 0 : h)}:${pad(mm)}`;
    }
    if (h > 23) return null;
    return h24 || h >= 13 || (twoDigit && h < 10) ? `${pad(h)}:${pad(mm)}` : null;
  };
  return rows.map((r) => draft({ name: r.name, ...studio, weekday: r.day, time: clock(r.t) }));
}
