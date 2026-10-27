// Wolfram exercise library: STOP-EM's two gym days (deadlift, box squat, bench
// or overhead press, row or pull-up) plus the finisher (drop landings, carries,
// core), each with fallbacks so a missing piece of equipment never dead-ends
// the session. Core work never curls the spine: the UK osteoporosis consensus
// advises modifying sustained, repeated or end-range flexion, and nothing here
// needs it.
//
// Cues are plain language. Where studio training helps, they say so plainly:
// side-rib breathing carries straight over to bracing, but heavy lifting wants
// the belly pressed OUT against an imaginary belt, not drawn in.
//
//   needs      — equipment ids required (see EQUIPMENT in data/program.js).
//                Empty/absent = bodyweight, always available.
//   bodyweight — true hides the weight column in the set table.
//   impact     — logging sets of this exercise also earns Impact credit
//                (the drop landing is the impact bone responds to).
//   target     — fallback sets×reps; the home-gym session overrides it by
//                phase (see PHASES in data/program.js).

const YT = (name) =>
  'https://www.youtube.com/results?search_query=' +
  encodeURIComponent(name + ' exercise how to');

export const EX = {
  // ─── SQUAT ─────────────────────────────────────────────────
  box_squat: {
    name: 'Box squat', target: '5×5', type: 'strength', needs: ['barbell', 'rack', 'bench'],
    url: YT('barbell box squat'),
    cue: 'Same set-up as a back squat, with the bench (or a box) behind you at a height where your hips end level with your knees. Brace, sit back and down until you touch it, then stand straight back up. Touch, don’t rest: stay tight on the box. It makes every rep the same depth. Spotter arms just below the bottom position.',
  },
  back_squat: {
    name: 'Back squat', target: '3×8', type: 'strength', needs: ['barbell', 'rack'],
    url: YT('barbell back squat beginner'),
    cue: 'Bar across the meaty part of your upper back, not your neck. Feet about shoulder-width, toes turned out a little. Breathe into your belly and side ribs, brace, then sit down between your heels and stand by pushing the floor away. Set the spotter arms just below your lowest point: if a rep stalls, sit the bar onto them and step out.',
  },
  goblet_squat_kb: {
    name: 'Goblet squat (kettlebell)', target: '3×8', type: 'strength', needs: ['kettlebell'],
    url: YT('goblet squat kettlebell'),
    cue: 'Bell held at the chest by the horns, elbows tucked. Sit down between your hips, chest proud, heels heavy. Stand by pushing the floor away.',
  },
  goblet_squat_db: {
    name: 'Goblet squat (dumbbell)', target: '3×8', type: 'strength', needs: ['dumbbells'],
    url: YT('goblet squat dumbbell'),
    cue: 'Hold one dumbbell upright at your chest. Sit down between your hips, chest proud, heels heavy, then push the floor away to stand.',
  },
  chair_squat: {
    name: 'Sit-to-stand squat', target: '3×10', type: 'strength', needs: [], bodyweight: true,
    url: YT('sit to stand squat form'),
    cue: 'Stand from a chair without your hands, tap the seat, stand again. Slow on the way down.',
  },

  // ─── HINGE ─────────────────────────────────────────────────
  deadlift: {
    name: 'Deadlift', target: '3×8', type: 'strength', needs: ['barbell'],
    url: YT('conventional deadlift beginner form'),
    cue: 'Bar over the middle of your feet, shins an inch away. Hinge down and grip just outside your legs. Proud chest, flat back. Breathe in, brace, then push the floor away until you stand tall; squeeze your glutes at the top and don’t lean back. Lower by sending the hips back first. If your plates are small, start the bar on blocks or stacked plates so it sits at mid-shin.',
  },
  rack_pull: {
    name: 'Rack pull (from below the knee)', target: '5×5', type: 'strength', needs: ['barbell', 'rack'],
    url: YT('rack pull below knee'),
    cue: 'A deadlift that starts higher: set the spotter arms so the bar rests just below your knees. Same hinge, flat back and brace, then stand tall. A good swap on days the floor position feels awkward.',
  },
  kb_deadlift: {
    name: 'Kettlebell deadlift', target: '3×8', type: 'strength', needs: ['kettlebell'],
    url: YT('kettlebell deadlift form'),
    cue: 'Bell between your feet. Push your hips back, flat back, grab it, and stand by squeezing your glutes. Lower the same way. The hips do the work, not the back.',
  },
  db_rdl: {
    name: 'Dumbbell Romanian deadlift', target: '3×8', type: 'strength', needs: ['dumbbells'],
    url: YT('dumbbell romanian deadlift'),
    cue: 'Soft knees. Slide the dumbbells down your thighs as your hips travel back, and stop when the hamstrings pull. Drive the hips through to stand.',
  },
  glute_bridge: {
    name: 'Glute bridge', target: '3×12', type: 'strength', needs: [], bodyweight: true,
    url: YT('glute bridge form'),
    cue: 'On your back, knees bent. Squeeze your glutes to lift your hips into a straight line, pause, lower slowly. The squeeze is the exercise, not the arch.',
  },

  // ─── PRESS ─────────────────────────────────────────────────
  bench_press: {
    name: 'Bench press', target: '5×5', type: 'strength', needs: ['barbell', 'rack', 'bench'],
    url: YT('barbell bench press beginner'),
    cue: 'Bench in the rack, eyes under the bar, feet flat. Squeeze your shoulder blades together and down. Grip a little wider than your shoulders, lower the bar to your lower chest, press back up. Training alone: set the spotter arms just below where the bar touches your chest, so a stuck rep rests on them.',
  },
  db_bench_press: {
    name: 'Dumbbell bench press', target: '5×5', type: 'strength', needs: ['dumbbells', 'bench'],
    url: YT('dumbbell bench press'),
    cue: 'On the bench, dumbbells over your chest, shoulder blades squeezed together. Lower them to the sides of your chest, elbows at about 45°, then press up. The weight column is per hand.',
  },
  db_floor_press: {
    name: 'Dumbbell floor press', target: '5×5', type: 'strength', needs: ['dumbbells'],
    url: YT('dumbbell floor press'),
    cue: 'Lie on the floor, knees bent. Lower the dumbbells until your upper arms touch the floor, pause, press. The floor sets the depth.',
  },
  ohp: {
    name: 'Overhead press', target: '3×8', type: 'strength', needs: ['barbell', 'rack'],
    url: YT('barbell overhead press beginner'),
    cue: 'Bar resting on the front of your shoulders, hands just outside them, elbows slightly ahead of the bar. Squeeze your glutes, brace, and press straight up, moving your face back out of the way, then push your head through the window at the top. Ribs down: don’t lean back to finish a rep.',
  },
  db_press: {
    name: 'Dumbbell overhead press', target: '3×8', type: 'strength', needs: ['dumbbells'],
    url: YT('standing dumbbell overhead press'),
    cue: 'Standing, dumbbells at your shoulders, palms facing each other. Press up and slightly in until your arms are straight. Ribs down, glutes tight, no leaning back.',
  },
  kb_press: {
    name: 'Kettlebell press (one arm)', target: '3×6 each', type: 'strength', needs: ['kettlebell'],
    url: YT('single arm kettlebell press'),
    cue: 'Bell resting on your forearm at the shoulder, wrist straight. Squeeze your free fist and glutes, press up until the arm is straight. Too heavy for a clean rep? Use dumbbells instead.',
  },
  incline_pushup: {
    name: 'Incline push-up', target: '3×8', type: 'strength', needs: [], bodyweight: true,
    url: YT('incline push up counter'),
    cue: 'Hands on a counter or sturdy table, body one straight line. Chest to the edge, press away. Lower the surface as it gets easy.',
  },

  // ─── PULL + ROW ────────────────────────────────────────────
  assisted_pullup: {
    name: 'Feet-assisted pull-up', target: '5×5', type: 'strength', needs: ['pullup_bar'], bodyweight: true,
    url: YT('feet assisted pull up box'),
    cue: 'Put a bench, box or sturdy chair under the bar so you can hang with your feet on it. Pull your chest toward the bar, using your legs only as much as you need, then lower slowly. Use a little less leg each week. When five clean reps need almost none, try jumping chin-ups.',
  },
  jumping_chinup: {
    name: 'Jumping chin-up + drop landing', target: '3×5', type: 'strength', needs: ['pullup_bar'],
    bodyweight: true, impact: true,
    url: YT('jumping chin up slow negative'),
    cue: 'Stand under the bar, on a step if you need one. Palms facing you, jump up until your chin clears the bar, then lower yourself as slowly as you can, aiming for three seconds. Let go and land on both feet, knees soft, absorbing like a spring. The landing is part of the exercise: it’s the impact bone responds to.',
  },
  inverted_row: {
    name: 'Inverted row (bar in the rack)', target: '3×8', type: 'strength', needs: ['rack'], bodyweight: true,
    url: YT('inverted row barbell in rack'),
    cue: 'Set the bar in the rack at about hip height. Hang underneath it, heels on the floor, body in one straight line. Pull your chest to the bar, squeeze the shoulder blades, lower slowly. Walk your feet back to make it harder.',
  },
  db_row: {
    name: 'One-arm dumbbell row', target: '3×10', type: 'strength', needs: ['dumbbells'],
    url: YT('one arm dumbbell row bench'),
    cue: 'One hand and knee braced on a bench or chair, flat back. Pull the dumbbell to your hip, elbow leading. Lower with control. Each set is both arms.',
  },
  kb_row: {
    name: 'One-arm kettlebell row', target: '3×10', type: 'strength', needs: ['kettlebell'],
    url: YT('one arm kettlebell row'),
    cue: 'One hand braced on a bench or your knee, flat back. Pull the bell to your hip, elbow leading, lower with control. Each set is both arms.',
  },
  backpack_row: {
    name: 'Backpack row', target: '3×10', type: 'strength', needs: [],
    url: YT('backpack row bent over'),
    cue: 'Load a backpack with books, hinge over with a flat back, row it to your hip.',
  },

  // ─── FINISHER: landings, carries, core ─────────────────────
  drop_landing: {
    name: 'Drop landings', target: '3×10', type: 'impact', needs: [], bodyweight: true, impact: true,
    url: YT('drop landing box technique'),
    cue: 'Step off the edge (don’t jump) and land on both feet at once: balls of the feet, then heels, knees bending over your toes and hips sitting back like the top of a squat. Freeze for a second, as quietly as you can. Step back up: that’s one. If a height feels like too much, use the lower one.',
  },
  landing_small_jumps: {
    name: 'Small jumps (instead of drop landings)', target: '3×10', type: 'impact', needs: [], bodyweight: true, impact: true,
    url: YT('small pogo jumps'),
    cue: 'Your low-bone-density setting swaps landing from a height for small jumps on the spot: a hand’s height, landing softly on the balls of your feet. Ten per set.',
  },
  farmer_carry_kb: {
    name: 'Farmer’s carry (kettlebells)', target: '3×20 sec', type: 'carry', needs: ['kettlebell'], bodyweight: true,
    url: YT('farmers carry kettlebell'),
    cue: 'A kettlebell in each hand (the 35s to start). Stand tall and walk slowly for 20 seconds: ribs down, shoulders away from your ears, bells still at your sides.',
  },
  farmer_carry_db: {
    name: 'Farmer’s carry (dumbbells)', target: '3×20 sec', type: 'carry', needs: ['dumbbells'], bodyweight: true,
    url: YT('farmers carry dumbbell'),
    cue: 'The heaviest dumbbell you can grip in each hand. Stand tall and walk slowly for 20 seconds, ribs down, shoulders relaxed.',
  },
  tightrope_walk: {
    name: 'Tightrope walk', target: '3×20 sec', type: 'carry', needs: [], bodyweight: true,
    url: YT('heel to toe tandem walk balance'),
    cue: 'Walk heel-to-toe along a line for 20 seconds, eyes ahead, arms out only if you need them.',
  },
  suitcase_carry_kb: {
    name: 'One-arm carry (kettlebell)', target: '3×20 sec', type: 'carry', needs: ['kettlebell'], bodyweight: true,
    url: YT('suitcase carry kettlebell'),
    cue: 'One kettlebell, one hand. Walk for 20 seconds staying perfectly upright: don’t lean away from it. Switch hands each set.',
  },
  suitcase_carry_db: {
    name: 'One-arm carry (dumbbell)', target: '3×20 sec', type: 'carry', needs: ['dumbbells'], bodyweight: true,
    url: YT('suitcase carry dumbbell'),
    cue: 'One heavy dumbbell, one hand. Walk for 20 seconds without leaning away from it. Switch hands each set.',
  },
  t_balance: {
    name: 'T-balance', target: '3×20 sec', type: 'carry', needs: [], bodyweight: true,
    url: YT('t balance single leg'),
    cue: 'On one leg, tip forward from the hip until your body and free leg make a T. Hold, flat back. 20 seconds a side.',
  },
  dead_bug: {
    name: 'Dead bug', target: '1×10 each side', type: 'core', needs: [], bodyweight: true,
    url: YT('dead bug exercise'),
    cue: 'On your back, arms up to the ceiling, knees over hips. Press your low back gently into the floor and keep it there while you lower the opposite arm and leg, breathing out as they go. Slow, 10 each side. The spine stays still: that’s the exercise.',
  },
  side_plank: {
    name: 'Side plank', target: '1×20 sec each side', type: 'core', needs: [], bodyweight: true,
    url: YT('side plank beginner knees'),
    cue: 'On one forearm and the side of your feet (or knees, to start), body in one straight line. Hips high, 20 seconds a side.',
  },
};

// Slug for a custom/off-menu entry so it still gets its own history.
export function customKey(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return 'custom_' + (slug || 'lift');
}
