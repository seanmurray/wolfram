// Rest timer store. Owns: visible flag, end timestamp, exercise context, the
// active interval handle, and the audio graph. Pure state; the RestTimer
// component reads it and drives the SVG ring + button row.

import { create } from 'zustand';
import { restFor } from '../lib/rest';
import { useSettingsStore } from './settingsStore';
import { playTimerSound } from '../lib/timerSound';
import { scheduleTimerEndNotification, cancelTimerEndNotification } from '../lib/timerNotification.js';

let intervalId = null;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.18) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

const audio = {
  tick:  () => playTone(880, 0.08, 'sine', 0.08),
  beep:  () => playTone(880, 0.16, 'sine', 0.20),
  // End-of-rest sound: play the user's custom clip if they've set one,
  // otherwise the synth tone. (Foreground only — see lib/timerSound.)
  end:   () => { if (!playTimerSound()) playTone(523, 0.6, 'sine', 0.25); },
};

// Seconds left until `endsAt`, rounded up so "1" shows until the very end.
const secondsUntil = (endsAt) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

export const useRestTimer = create((set, get) => ({
  visible: false,
  exerciseName: '',
  role: null,
  total: 0,        // total seconds for this rest period
  remaining: 0,
  endsAt: 0,       // epoch ms. The countdown derives from this, not from ticks,
                   // because iOS suspends JS in the background: a tick counter
                   // would resume from wherever it froze.
  rpeNote: '',     // human-readable adjustment hint, e.g. "+15 sec from RPE 8.5"

  // auto: true means "the app is starting this because a set was ticked off",
  // which the autoStart preference can veto. A tap on the card's Start button
  // passes auto: false and always runs — turning autoStart off should mean
  // "don't surprise me", not "no timer for you".
  start: ({ exerciseName, role, context, rpe, auto = false }) => {
    const prefs = useSettingsStore.getState().timerPrefs;
    if (auto && !prefs.autoStart) return;

    // Same call the card uses for its suggestion, so the number on the card
    // and the number in the ring can never disagree.
    const { seconds: total, why } = restFor({ role, context, rpe });
    const note = rpe == null ? '' : why;
    const endsAt = Date.now() + total * 1000;

    if (intervalId) clearInterval(intervalId);
    set({ visible: true, exerciseName, role, total, remaining: total, endsAt, rpeNote: note });

    if (prefs.audio) audio.tick();
    if (prefs.vibrate && navigator.vibrate) navigator.vibrate(20);
    // Native: alerts even with the screen off. Web: no-op.
    scheduleTimerEndNotification({ endsAt, exerciseName, role, sound: prefs.audio });

    let beeped = false;
    intervalId = setInterval(() => {
      const { endsAt: end, remaining: shown } = get();
      const next = secondsUntil(end);
      if (next > 5) beeped = false; // +15 pushed it back past the warning
      if (!beeped && next > 0 && next <= 5 && prefs.audio) {
        beeped = true;
        // 3 quick beeps at 5 sec.
        audio.beep();
        setTimeout(() => audio.beep(), 220);
        setTimeout(() => audio.beep(), 440);
      }
      if (next <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        // Back from the background long after the end: the notification has
        // already alerted, so don't ding a second time.
        const late = Date.now() - end > 2000;
        if (!late) {
          if (prefs.audio) audio.end();
          if (prefs.vibrate && navigator.vibrate) navigator.vibrate([100, 60, 100]);
        }
        set({ visible: false, remaining: 0 });
        return;
      }
      if (next !== shown) set({ remaining: next });
    }, 250);
  },

  adjust: (deltaSec) => {
    const cur = get();
    const endsAt = Math.max(Date.now(), cur.endsAt + deltaSec * 1000);
    const remaining = secondsUntil(endsAt);
    const total = Math.max(cur.total, remaining);
    set({ endsAt, remaining, total });
    scheduleTimerEndNotification({
      endsAt,
      exerciseName: cur.exerciseName,
      role: cur.role,
      sound: useSettingsStore.getState().timerPrefs.audio,
    });
  },

  skip: () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    set({ visible: false, remaining: 0 });
    cancelTimerEndNotification();
  },
}));
