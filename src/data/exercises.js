// Wolfram exercise library: the LIFTMOR four (squat, deadlift, overhead press,
// jumping chin-up with a drop landing), each with fallbacks so a missing piece
// of equipment never dead-ends the session.
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
//                phase (learn 3×8, heavy 5×5).

const YT = (name) =>
  'https://www.youtube.com/results?search_query=' +
  encodeURIComponent(name + ' exercise how to');

export const EX = {
  // ─── SQUAT ─────────────────────────────────────────────────
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

  // ─── PULL + LANDING ────────────────────────────────────────
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
    cue: 'One hand and knee braced on a bench or chair, flat back. Pull the dumbbell to your hip, elbow leading. Lower with control.',
  },
  backpack_row: {
    name: 'Backpack row', target: '3×10', type: 'strength', needs: [],
    url: YT('backpack row bent over'),
    cue: 'Load a backpack with books, hinge over with a flat back, row it to your hip.',
  },
};

// Slug for a custom/off-menu entry so it still gets its own history.
export function customKey(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return 'custom_' + (slug || 'lift');
}
