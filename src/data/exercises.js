// Wolfram exercise library — movement for the next forty years.
//
// Written for an adult easing into (or back into) training. Every cue is
// plain language, every prescription leaves reps in the tank. The athletic
// DNA (hip coil, carries, hinging — a gentle nod to Judd Lienhard's movement
// ideas) is here, minus the intensity.
//
//   needs      — equipment ids required (see EQUIPMENT in data/program.js).
//                Empty/absent = bodyweight, always available.
//   bodyweight — true hides the weight column in the set table.
//   target     — sets×reps the table pre-fills; "2-3 in the tank" is the rule.
//   type       — everything strength-style logs sets/reps; 'move' items log
//                minutes + a note.

const YT = (name) =>
  'https://www.youtube.com/results?search_query=' +
  encodeURIComponent(name + ' exercise how to');

export const EX = {
  // ─── SQUAT family ──────────────────────────────────────────
  goblet_squat_db: {
    name: 'Goblet squat (dumbbell)', target: '2×8', type: 'strength', needs: ['dumbbells'],
    url: YT('goblet squat dumbbell'),
    cue: 'Hold one dumbbell at your chest. Sit down between your hips, chest proud, heels heavy. Inhale on the way down, exhale as you push the floor away. Smooth beats deep.',
  },
  goblet_squat_kb: {
    name: 'Goblet squat (kettlebell)', target: '2×8', type: 'strength', needs: ['kettlebell'],
    url: YT('goblet squat kettlebell'),
    cue: 'Bell held at the chest, elbows soft. Sit between your hips, stand tall. If depth feels cranky, stop where it feels strong.',
  },
  chair_squat: {
    name: 'Sit-to-stand squat', target: '2×10', type: 'strength', needs: [], bodyweight: true,
    url: YT('sit to stand squat form'),
    cue: 'Stand from a chair without hands, tap the seat, stand again. Slow on the way down, exhale on the way up. The single most useful strength skill for the next 40 years.',
  },

  // ─── HINGE family ──────────────────────────────────────────
  kb_deadlift: {
    name: 'Kettlebell deadlift', target: '2×8', type: 'strength', needs: ['kettlebell'],
    url: YT('kettlebell deadlift form'),
    cue: 'Bell between your feet. Push your hips back, flat back, grab it, stand by squeezing your glutes. Lower the same way. Hips do the work, not the back. One slow breath into the belt line before each pickup — that gentle all-around firmness IS the brace.',
  },
  db_rdl: {
    name: 'Dumbbell RDL', target: '2×8', type: 'strength', needs: ['dumbbells'],
    url: YT('dumbbell romanian deadlift'),
    cue: 'Soft knees, slide the dumbbells down your thighs as your hips travel back. Stop when the hamstrings say hello. Breathe low and wide, keep the soft brace, exhale as you drive the hips through to stand.',
  },
  barbell_rdl: {
    name: 'Barbell RDL', target: '2×8', type: 'strength', needs: ['barbell'],
    url: YT('barbell romanian deadlift light'),
    cue: 'Soft knees, bar slides down the thighs as the hips travel back — flat back the whole way, stop well before it wants to round. Start embarrassingly light; with a low-back history, the empty bar for a few weeks IS the program. Inhale low, gentle all-around firmness, exhale up.',
  },
  glute_bridge: {
    name: 'Glute bridge', target: '2×12', type: 'strength', needs: [], bodyweight: true,
    url: YT('glute bridge form'),
    cue: 'On your back, knees bent. Squeeze your glutes to lift your hips into a straight line, pause a beat, lower slow. No lower-back arching — the squeeze is the exercise.',
  },

  // ─── PUSH family ───────────────────────────────────────────
  db_floor_press: {
    name: 'Dumbbell floor press', target: '2×8', type: 'strength', needs: ['dumbbells'],
    url: YT('dumbbell floor press'),
    cue: 'On your back, press the dumbbells up until arms are straight, lower until your upper arms rest gently on the floor. Shoulder-friendly pressing.',
  },
  band_chest_press: {
    name: 'Band chest press', target: '2×10', type: 'strength', needs: ['bands'],
    url: YT('resistance band chest press standing'),
    cue: 'Band around your upper back, press both hands forward to full reach. Control the return — the band always wants to win the way back.',
  },
  incline_pushup: {
    name: 'Incline push-up', target: '2×8', type: 'strength', needs: [], bodyweight: true,
    url: YT('incline push up counter'),
    cue: 'Hands on a counter or sturdy table, body one straight line. Chest to the edge, press away. Lower the surface as it gets easy — that IS the progress.',
  },
  db_press: {
    name: 'Dumbbell shoulder press (neutral grip)', target: '2×8', type: 'strength', needs: ['dumbbells'],
    url: YT('neutral grip dumbbell shoulder press'),
    cue: 'Palms facing each other — the shoulder-friendliest pressing angle. Press up and very slightly forward; full overhead lockout is optional. Stop below any pinch, always. Ribs down, no leaning back.',
  },
  band_press: {
    name: 'Band overhead press', target: '2×10', type: 'strength', needs: ['bands'],
    url: YT('resistance band overhead press'),
    cue: 'Stand on the band, press up — full lockout only if the shoulder is happy there; stopping short is fine. Squeeze your belly so the ribs stay down.',
  },
  wall_pushup_plus: {
    name: 'Push-up plus (incline)', target: '2×10', type: 'strength', needs: [], bodyweight: true,
    url: YT('push up plus scapular'),
    cue: 'Incline push-up, then at the top push the floor away an extra inch so your shoulder blades spread. That extra inch keeps shoulders happy for decades.',
  },

  // ─── PULL family ───────────────────────────────────────────
  trx_row: {
    name: 'Suspension row (TRX/rings)', target: '2×10', type: 'strength', needs: ['suspension'], bodyweight: true,
    url: YT('trx row form beginner'),
    cue: 'Lean back holding the straps, body one straight line, pull your chest to your hands and squeeze the shoulder blades. Walk your feet to make it easier or harder. The most back-friendly row there is — no bent-over position to hold.',
  },
  db_row: {
    name: 'One-arm dumbbell row', target: '2×10', type: 'strength', needs: ['dumbbells'],
    url: YT('one arm dumbbell row chair support'),
    cue: 'One hand braced on a chair so your back never works unsupported, flat back. Pull the dumbbell to your hip — elbow, not hand, leads. Lower with control.',
  },
  band_row: {
    name: 'Band row', target: '2×12', type: 'strength', needs: ['bands'],
    url: YT('resistance band row anchored'),
    cue: 'Band anchored at chest height (door anchor or railing). Pull elbows past your ribs, squeeze the shoulder blades, slow return.',
  },
  backpack_row: {
    name: 'Backpack row', target: '2×10', type: 'strength', needs: [], bodyweight: false,
    url: YT('backpack row bent over'),
    cue: 'Load a backpack with books, hinge over with a flat back, row it to your hip. The humble backpack is a fine barbell.',
  },
  dead_hang: {
    name: 'Dead hang', target: '3×20 sec', type: 'strength', needs: ['pullup_bar'], bodyweight: true,
    url: YT('dead hang benefits form'),
    cue: 'Hang from the bar, shoulders relaxed but not slack, breathe. Keep your toes on the floor or a step and take some weight through them if the shoulder complains — a partial hang still counts. Grip strength is one of the best-studied longevity markers.',
  },
  band_pulldown: {
    name: 'Band pulldown', target: '2×12', type: 'strength', needs: ['bands'],
    url: YT('resistance band lat pulldown kneeling'),
    cue: 'Band anchored high. Kneel, pull elbows down to your ribs, feel the armpit muscles do it. Slow up, smooth down.',
  },
  prone_swimmers: {
    name: 'Prone swimmers', target: '2×6', type: 'strength', needs: [], bodyweight: true,
    url: YT('prone swimmers shoulder exercise'),
    cue: 'Lying face down, float your arms and sweep them from overhead to your hips like a slow backstroke. Small, honest movement — huge shoulder-health payoff.',
  },

  // ─── SINGLE LEG ────────────────────────────────────────────
  split_squat_db: {
    name: 'Split squat (dumbbells)', target: '2×8 each', type: 'strength', needs: ['dumbbells'],
    url: YT('dumbbell split squat'),
    cue: 'Stagger stance, drop the back knee toward the floor, stand through the front heel. Hold dumbbells at your sides. Wobble is normal — that is balance being built.',
  },
  split_squat_bw: {
    name: 'Split squat', target: '2×10 each', type: 'strength', needs: [], bodyweight: true,
    url: YT('bodyweight split squat'),
    cue: 'Stagger stance, back knee toward the floor, up through the front heel. Fingertips on a wall for balance is completely allowed.',
  },
  step_up: {
    name: 'Step-up', target: '2×8 each', type: 'strength', needs: ['bench'],
    url: YT('step up exercise form'),
    cue: 'Whole foot on the bench or bottom stair. Drive through that foot — do not push off the floor leg. Step down slow. Add dumbbells when it feels easy.',
  },

  // ─── CARRY family ──────────────────────────────────────────
  suitcase_carry_db: {
    name: 'Suitcase carry (dumbbell)', target: '3×30 sec', type: 'strength', needs: ['dumbbells'],
    url: YT('suitcase carry form'),
    cue: 'One dumbbell in one hand, walk tall — do NOT lean toward the weight. Switch hands each round. Tall spine, steady breath, attention on staying level.',
  },
  suitcase_carry_kb: {
    name: 'Suitcase carry (kettlebell)', target: '3×30 sec', type: 'strength', needs: ['kettlebell'],
    url: YT('kettlebell suitcase carry'),
    cue: 'Bell in one hand, walk tall and level. The trunk resisting the lean is the whole point.',
  },
  backpack_carry: {
    name: 'Loaded backpack carry', target: '3×45 sec', type: 'strength', needs: [],
    url: YT('weighted carry rucking benefits'),
    cue: 'Load the backpack, hold it in one hand like a suitcase (or hug it to your chest) and walk tall. Rucking-lite — cheap, effective, kind to the joints. Tall spine, unhurried breath.',
  },

  // ─── ROTATION & COIL — the gentle Lienhard nod ─────────────
  hip_coil_walk: {
    name: 'Walking hip coil', target: '2×8 each', type: 'strength', needs: [], bodyweight: true,
    url: 'https://www.youtube.com/results?search_query=Judd+Lienhard+hip+coil+walk',
    cue: 'Walk slowly; on each step let the standing hip rotate you slightly over it, arms swinging naturally across. Athletic hips at conversation pace. No intensity needed — just the pattern and the breath.',
  },
  kb_coil_walk: {
    name: 'Walking coil with kettlebell', target: '2×6 each', type: 'strength', needs: ['kettlebell'],
    url: 'https://www.youtube.com/results?search_query=Judd+Lienhard+walking+KB+high+pull+coil',
    cue: 'Walk forward; each step, draw the bell up your side as the same-side hip coils under you. Light bell, smooth rhythm. Stop the set the moment it stops feeling springy.',
  },
  medball_rotation: {
    name: 'Med-ball rotation toss', target: '2×8 each', type: 'strength', needs: ['medball'],
    url: YT('medicine ball rotational toss light wall'),
    cue: 'Side-on to a wall with a LIGHT ball. Turn the hips away, then unwind and toss it gently into the wall — the hips do the throwing, the shoulders just come along. Smooth and playful, never max effort.',
  },
  band_rotation: {
    name: 'Band rotation', target: '2×10 each', type: 'strength', needs: ['bands'],
    url: YT('standing band rotation core'),
    cue: 'Band anchored at chest height, arms long, rotate away from the anchor by turning your hips first, then shoulders. Unwind with control.',
  },

  // ─── BALANCE & CORE ────────────────────────────────────────
  sl_balance_reach: {
    name: 'Single-leg balance reach', target: '2×5 each', type: 'strength', needs: [], bodyweight: true,
    url: YT('single leg balance reach'),
    cue: 'Stand on one leg, soft knee, reach the other foot forward, then to the side. Balance is use-it-or-lose-it — five quiet reps a side keeps it.',
  },
  dead_bug: {
    name: 'Dead bug', target: '2×8 each', type: 'strength', needs: [], bodyweight: true,
    url: YT('dead bug core exercise'),
    cue: 'On your back, low back gently pressed to the floor. Lower opposite arm and leg slowly, exhaling slowly as they travel — let the breath set the tempo. If the back lifts, shrink the movement.',
  },
  side_plank_knees: {
    name: 'Side plank (from knees)', target: '3×20 sec each', type: 'strength', needs: [], bodyweight: true,
    url: YT('side plank from knees'),
    cue: 'On your elbow and bent knees, lift the hips into a straight line and hold with calm, even breathing — never breath-holding. Straight-leg version when the 20 seconds feel easy.',
  },
};

// Slug for a custom/off-menu entry so it still gets its own history.
export function customKey(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return 'custom_' + (slug || 'lift');
}
