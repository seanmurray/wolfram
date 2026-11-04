import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readClasses, readTime, readWeekday, matchStudio, textToLines } from './readClass.js';
import { linkSavePlan } from './classpass.js';

// Invented names, laid out like real ClassPass class pages (the real
// screenshots stay outside this public repo). Wed 4 Nov 2026.
const NOW = new Date(2026, 10, 4, 11, 30);
const STUDIO = { id: 's1', name: 'Example Strength Co', town: 'Springfield', link: null };

const line = (text, y, x = 0.05, h = 0.014) => ({ text, x, y, w: 0.6, h });
const BODY = [
  line('20 credits >', 0.09, 0.77, 0.012),
  line('Bring a plus-one', 0.27, 0.21),
  line('Invite a friend', 0.27, 0.68, 0.012),
  line('Saved', 0.36, 0.16), line('Share', 0.36, 0.42), line('Add', 0.36, 0.66),
  line('Details', 0.45, 0.05, 0.017),
  line('An all-levels barbell class. 60 minutes', 0.49, 0.05, 0.017),
  line('Ratings and reviews', 0.63, 0.05, 0.021),
  line('Kettlebell Flow', 0.75, 0.53, 0.017), // a review naming another class
  line('6 credits', 0.93), line('Reserve', 0.93, 0.69),
];

// The top of the page, read cleanly.
const TOP = [
  line('9:41', 0.02, 0.1),
  line('Barbell Basics', 0.06, 0.05, 0.03),
  line('Example Strength Co • Springfield >', 0.1, 0.05, 0.015),
  line('Strength', 0.125),
  line('100+ bookings this week', 0.15, 0.12),
  line('Wed, Nov 4 · 6:00 PM – 7:00 PM', 0.2, 0.13),
  line('Alex R', 0.22, 0.13, 0.012),
  ...BODY,
];

// Scrolled a little, with the misreads seen in real screenshots: the title
// gone under the clock, the studio's first word under the back button, the
// dot read as a dash and zeros as O.
const SCROLLED = [
  line('11:34', 0.03, 0.1),
  line('mple Strength Co • Springfield >', 0.077, 0.135, 0.015),
  line('100+ bookings this week', 0.144, 0.12),
  line('wed, Nov4-6:OO PM -7:00 PM', 0.195, 0.13),
  line('Alex R', 0.216, 0.13, 0.012),
  ...BODY,
];

// Scrolled further: no studio line, and the weekday's first letter is lost.
const FURTHER = [
  line('Strength', 0.01),
  line('ved, Nov 4-7:30 PM - 8:30 PM', 0.096, 0.15),
  ...BODY.map((l) => ({ ...l, y: l.y - 0.1 })),
];

describe('readClasses: a class page', () => {
  it('reads name, studio, day and time from the top of the page', () => {
    const { classes, link } = readClasses(TOP, { now: NOW });
    assert.equal(classes.length, 1);
    const [c] = classes;
    assert.equal(c.name, 'Barbell Basics');
    assert.equal(c.studio, 'Example Strength Co, Springfield');
    assert.equal(c.studioName, 'Example Strength Co');
    assert.equal(c.town, 'Springfield');
    assert.equal(c.weekday, 2);
    assert.equal(c.time, '18:00');
    assert.deepEqual(c.missing, []);
    assert.equal(link, null);
  });

  it('copes with a scrolled page: no name rather than a wrong one', () => {
    const [c] = readClasses(SCROLLED, { now: NOW }).classes;
    assert.equal(c.name, '');
    assert.equal(c.studioName, 'mple Strength Co');
    assert.equal(c.weekday, 2);
    assert.equal(c.time, '18:00');
    assert.deepEqual(c.missing, ['name']);
  });

  it('matches a saved studio even with its first word hidden', () => {
    const [c] = readClasses(SCROLLED, { now: NOW, studios: [STUDIO] }).classes;
    assert.equal(c.studio, 'Example Strength Co, Springfield');
    assert.equal(c.studioName, 'Example Strength Co');
  });

  it('takes the day from the date when the weekday is misread', () => {
    const [c] = readClasses(FURTHER, { now: NOW }).classes;
    assert.equal(c.weekday, 2);
    assert.equal(c.time, '19:30');
    assert.equal(c.name, '');
    assert.equal(c.studio, '');
  });

  it('never reads the description or reviews', () => {
    const [c] = readClasses(FURTHER, { now: NOW }).classes;
    assert.notEqual(c.name, 'Kettlebell Flow');
  });

  it('finds nothing in a screenshot with no date line', () => {
    const photo = [line('Happy birthday!', 0.4), line('11:34', 0.03)];
    assert.deepEqual(readClasses(photo, { now: NOW }), { classes: [], link: null });
    assert.deepEqual(readClasses([], { now: NOW }).classes, []);
  });
});

describe('readClasses: pasted text', () => {
  it('reads text copied out of a screenshot', () => {
    const text = [
      'Barbell Basics',
      'Example Strength Co • Springfield',
      'Strength',
      'Wed, Nov 4 · 6:00 PM – 7:00 PM',
      'Alex R',
      'Bring a plus-one',
      'Details',
    ].join('\n');
    const [c] = readClasses(textToLines(text), { now: NOW }).classes;
    assert.equal(c.name, 'Barbell Basics');
    assert.equal(c.studio, 'Example Strength Co, Springfield');
    assert.equal(c.weekday, 2);
    assert.equal(c.time, '18:00');
  });

  it('pulls out a ClassPass link, with or without a class', () => {
    const invite = 'https://classpass.com/invite/ABC123?placement=VenueDetails';
    assert.deepEqual(readClasses(textToLines(invite), { now: NOW }), { classes: [], link: invite });
    const both = `Barbell Basics\nExample Strength Co • Springfield\nWed, Nov 4 · 6 PM\n${invite}`;
    const r = readClasses(textToLines(both), { now: NOW });
    assert.equal(r.link, invite);
    assert.equal(r.classes[0].time, '18:00');
  });
});

describe('readTime', () => {
  it('reads 12-hour times, with or without minutes', () => {
    assert.equal(readTime('6:00 PM'), '18:00');
    assert.equal(readTime('6 pm'), '18:00');
    assert.equal(readTime('7:15 a.m.'), '07:15');
  });
  it('handles noon and midnight', () => {
    assert.equal(readTime('12:00 PM'), '12:00');
    assert.equal(readTime('12:15 AM'), '00:15');
  });
  it('gives a range’s start the end’s AM/PM, unless that puts it after the end', () => {
    assert.equal(readTime('6:00 – 7:00 PM'), '18:00');
    assert.equal(readTime('11:30 - 12:30 PM'), '11:30');
    assert.equal(readTime('11:30 AM – 12:30 PM'), '11:30');
  });
  it('reads 24-hour times only when they can’t be anything else', () => {
    assert.equal(readTime('18:30'), '18:30');
    assert.equal(readTime('06:30'), '06:30');
    assert.equal(readTime('11:34'), null); // a status-bar clock
    assert.equal(readTime('6:30'), null);
  });
  it('fixes letters read in place of digits', () => {
    assert.equal(readTime('Nov4-6:OO PM -7:00 PM'), '18:00');
    assert.equal(readTime('l0:3O AM'), '10:30');
  });
  it('ignores numbers that aren’t times', () => {
    assert.equal(readTime('Heated 90-95, 60 minutes'), null);
    assert.equal(readTime(''), null);
  });
});

describe('readWeekday (0 = Mon)', () => {
  it('reads the date, nearest to now', () => {
    assert.equal(readWeekday('Wed, Nov 4', NOW), 2);
    assert.equal(readWeekday('ved, Nov 4', NOW), 2);
    assert.equal(readWeekday('Nov4-6:00 PM', NOW), 2);
  });
  it('crosses into next year', () => {
    // 7 Jan 2027 is a Thursday.
    assert.equal(readWeekday('Thu, Jan 7', new Date(2026, 11, 30)), 3);
  });
  it('falls back to the weekday word, then Today/Tomorrow', () => {
    assert.equal(readWeekday('Friday 6 PM', NOW), 4);
    assert.equal(readWeekday('Today · 6 PM', NOW), 2);
    // Sunday 8 Nov: tomorrow is Monday, across the week boundary.
    assert.equal(readWeekday('Tomorrow', new Date(2026, 10, 8, 9)), 0);
    assert.equal(readWeekday('6 PM', NOW), null);
  });
});

describe('matchStudio', () => {
  const other = { id: 's2', name: 'Riverside Pilates', town: 'Shelbyville', link: null };
  it('matches on the name, or half of it plus the town', () => {
    assert.equal(matchStudio('Example Strength Co • Springfield', [other, STUDIO]), STUDIO);
    assert.equal(matchStudio('3e Strength Co • Springfield >', [other, STUDIO]), STUDIO);
    assert.equal(matchStudio('Riverside Pilates', [other, STUDIO]), other);
  });
  it('doesn’t match on a town or one shared word alone', () => {
    assert.equal(matchStudio('Downtown Yoga • Springfield', [STUDIO]), null);
    assert.equal(matchStudio('Strength Lab', [STUDIO]), null);
  });
});

describe('linkSavePlan', () => {
  const link = 'https://classpass.com/studios/example-strength-springfield';
  const read = { studio: 'Example Strength Co, Springfield', studioName: 'Example Strength Co', town: 'Springfield' };
  it('saves the link on a matching studio that has none', () => {
    assert.deepEqual(linkSavePlan([STUDIO], read, link), { action: 'set', id: 's1' });
    assert.deepEqual(linkSavePlan([STUDIO], { studio: 'example strength co' }, link), { action: 'set', id: 's1' });
  });
  it('keeps a studio’s existing link', () => {
    const has = { ...STUDIO, link: 'https://classpass.com/studios/old' };
    assert.deepEqual(linkSavePlan([has], read, link), { action: 'kept', id: 's1' });
    assert.deepEqual(linkSavePlan([{ ...STUDIO, link }], read, link), { action: 'same', id: 's1' });
  });
  it('adds a new studio, split the way it was read', () => {
    assert.deepEqual(linkSavePlan([], read, link), {
      action: 'add', studio: { name: 'Example Strength Co', town: 'Springfield', link },
    });
    assert.deepEqual(linkSavePlan([], { ...read, studio: 'Example Strength' }, link), {
      action: 'add', studio: { name: 'Example Strength', town: '', link },
    });
  });
  it('needs a studio name, and does nothing without a link', () => {
    assert.deepEqual(linkSavePlan([STUDIO], { studio: ' ' }, link), { action: 'needStudio' });
    assert.deepEqual(linkSavePlan([STUDIO], read, null), { action: 'none' });
  });
});
