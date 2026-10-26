// Custom rest-timer end sound — a user-recorded or uploaded clip that plays
// (instead of the synth tone) when the timer hits zero. Stored on-device as a
// data URL in its own localStorage key so it doesn't bloat the settings blob.
//
// FOREGROUND ONLY: like the synth tone, this plays only while the app is the
// active page. A PWA can't fire audio from the background/locked screen — that
// needs the native (Capacitor) wrap, where this same clip can become the local
// notification sound. See the RestTimer discussion.

const KEY = 'wolfram-timer-sound';
// Keep clips short. A ~5s voice clip is well under this; the cap protects the
// ~5MB localStorage quota (data URLs are strings, and base64 adds ~33%).
const MAX_CHARS = 700 * 1024;

export function getTimerSound() {
  try { return localStorage.getItem(KEY) || null; } catch { return null; }
}
export function hasTimerSound() {
  return !!getTimerSound();
}

// Returns { ok } or { ok:false, error }.
export function setTimerSound(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:audio')) {
    return { ok: false, error: 'That file is not an audio clip.' };
  }
  if (dataUrl.length > MAX_CHARS) {
    return { ok: false, error: 'Clip is too large — keep it under ~5 seconds.' };
  }
  try {
    localStorage.setItem(KEY, dataUrl);
    cached = null; // force reload on next play
    return { ok: true };
  } catch {
    return { ok: false, error: 'Not enough storage space for the clip.' };
  }
}

export function clearTimerSound() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  cached = null;
}

// Reuse one Audio element so we don't re-decode on every play.
let el = null;
let cached = null;

function ensureEl() {
  const src = getTimerSound();
  if (!src) return null;
  if (!el) el = new Audio();
  if (cached !== src) { el.src = src; cached = src; }
  return el;
}

// Play the custom clip. Returns true if one was played, false if none is set
// (so the caller can fall back to the synth tone).
export function playTimerSound() {
  const a = ensureEl();
  if (!a) return false;
  try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* ignore */ }
  return true;
}
