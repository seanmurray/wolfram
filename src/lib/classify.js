// Class formats — what a studio class actually does for bone.
//
// A class's NAME is a weak signal (a "strength" class can mean 5 lb
// dumbbells), so this only suggests a format when a class is added; the user
// confirms it, and "did you go heavy?" settles each logged session.

export const FORMATS = {
  lifting: {
    label: 'Lifting',
    hint: 'Barbell, kettlebell, powerlifting, CrossFit',
    heavyEligible: true,
  },
  impact: {
    label: 'Impact',
    hint: 'Bootcamp, HIIT, plyo, jump rope, running',
    heavyEligible: true,
  },
  studio: {
    label: 'Studio',
    hint: 'Yoga, pilates, reformer, barre, sculpt',
    heavyEligible: false,
  },
  cardio: {
    label: 'Cardio',
    hint: 'Spin, rowing, swimming: great for the heart, no bone credit',
    heavyEligible: false,
  },
};

export const FORMAT_ORDER = ['lifting', 'impact', 'studio', 'cardio'];

// Checked in order, first match wins. Studio words beat strength words on
// purpose: "Strength Pilates" and "Sculpt & Strength" are light-load classes
// whatever they're called. Impact beats lifting so a "HIIT Strength" class
// earns its impact credit (it's still heavy-eligible).
const RULES = [
  ['cardio', /\b(spin\w*|cycl\w*|rid(e|ing)|row(ing|er)?|swim\w*|aqua)\b/i],
  ['studio', /\b(yoga|vinyasa|hatha|yin|ashtanga|pilates|reformer|barre|sculpt\w*|ton(e|ing)|stretch\w*|mobility|flow|pump|restorative|meditat\w*)\b/i],
  ['impact', /\b(boot\s?camp|hiit|plyo\w*|jump\w*|rope|dance|run\w*|tread\w*|sprint\w*|tabata|circuit)\b/i],
  ['lifting', /\b(barbell|lift\w*|powerlift\w*|olympic|oly|weightlift\w*|strength|crossfit|kettlebells?|kb|squat\w*|deadlift\w*)\b/i],
];

export function classifyClass(name) {
  for (const [format, re] of RULES) if (re.test(String(name ?? ''))) return format;
  return 'studio';
}

// What one logged class counts as this week. A heavy-eligible class only earns
// Heavy when the user says it actually went heavy; a lifting class that
// didn't is honest strength work, credited as Studio.
export function bucketsFor(format, wentHeavy) {
  switch (format) {
    case 'lifting': return wentHeavy ? ['heavy'] : ['studio'];
    case 'impact':  return wentHeavy ? ['impact', 'heavy'] : ['impact'];
    case 'cardio':  return ['cardio'];
    default:        return ['studio'];
  }
}
