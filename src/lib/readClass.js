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

// { classes: [{ name, studio, studioName, town, weekday, time, missing }], link }
export function readClasses(lines, { now = new Date(), studios = [] } = {}) {
  const all = [...(lines ?? [])]
    .filter((l) => l && String(l.text ?? '').trim())
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));
  const link = parseClassPassLink(all.map((l) => l.text).join('\n'));
  const positioned = all.some((l) => l.h != null);

  // Lines before the action row, minus the clock, credits and bookings.
  const cut = all.findIndex((l) => CUT.test(l.text.trim()));
  const header = (cut === -1 ? all : all.slice(0, cut)).map((l) => ({ ...l, text: l.text.trim() }));

  const dateAt = header.findIndex((l) => isDateLine(l.text));
  if (dateAt === -1) return { classes: [], link };
  const dateLine = header[dateAt].text;

  // Name and studio sit above the date line.
  const above = header.slice(0, dateAt).filter((l) => !JUNK.test(l.text) && /[a-z]{3}/i.test(l.text));
  const studioAt = above.findIndex((l) => matchStudio(l.text, studios) || splitStudioLine(l.text));
  let studio = '';
  let studioName = '';
  let town = '';
  let name = '';
  if (studioAt !== -1) {
    const line = above[studioAt].text;
    const saved = matchStudio(line, studios);
    const split = splitStudioLine(line);
    if (saved) {
      studio = studioLabel(saved);
      studioName = saved.name;
      town = saved.town ?? '';
    } else if (split) {
      studioName = split.name;
      town = split.town;
      studio = studioLabel({ name: studioName, town });
    }
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

  const c = {
    name,
    studio,
    studioName,
    town,
    weekday: readWeekday(dateLine, now),
    time: readTime(dateLine),
  };
  c.missing = ['name', 'studio'].filter((k) => !c[k]);
  return { classes: [c], link };
}
