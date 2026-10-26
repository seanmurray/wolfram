// Native-only: schedule a local notification for the end of a rest (or the
// 30 s between jumps), so it alerts even when the app is backgrounded or the
// screen is locked. The WebView's JS, and with it the in-app sound, is
// suspended there. Adapted from soccer-coach's timerNotification.
//
// On the web this is a complete no-op: the plugin is imported only on native,
// so the PWA bundle and behaviour are unchanged.
//
// silent: true is honoured only for FOREGROUND presentation. In the
// foreground the in-app sound plays and the notification stays invisible; in
// the background iOS delivers it with the system sound.

import { isNative } from './nativeFile.js';

const NOTIF_ID = 4207;

// Resolves to the module, never the plugin itself: Capacitor's plugin proxy
// answers every property, `then` included, so any promise resolved with it
// calls LocalNotifications.then(), which rejects as unimplemented (that made
// this a silent no-op on native). Callers read `.LocalNotifications` after
// the await.
let modPromise = null;
function getModule() {
  if (!isNative()) return Promise.resolve(null);
  if (!modPromise) modPromise = import('@capacitor/local-notifications').catch(() => null);
  return modPromise;
}

// Asks once, the first time a timer runs. A "no" just means no screen-off
// alert; everything in the app works the same.
async function ensurePermission(ln) {
  let { display } = await ln.checkPermissions();
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    ({ display } = await ln.requestPermissions());
  }
  return display === 'granted';
}

// Best-effort: any failure (permission denied, plugin missing) means no
// background alert; the in-app foreground behaviour is unaffected.
export async function scheduleTimerEndNotification({ endsAt, exerciseName, role, sound }) {
  const ln = (await getModule())?.LocalNotifications;
  if (!ln) return;
  try {
    if (!(await ensurePermission(ln))) return;
    await ln.cancel({ notifications: [{ id: NOTIF_ID }] });
    if (endsAt - Date.now() < 1000) return; // ends now: the in-app path covers it
    const jump = role === 'jump';
    await ln.schedule({
      notifications: [{
        id: NOTIF_ID,
        title: jump ? 'Next jump' : 'Rest over',
        body: jump ? 'Thirty seconds are up. Time for the next jump.' : exerciseName ? `Next set: ${exerciseName}` : 'Time for the next set',
        schedule: { at: new Date(endsAt) },
        sound: sound ? 'default' : undefined,
        silent: true,
      }],
    });
  } catch { /* best-effort */ }
}

export async function cancelTimerEndNotification() {
  const ln = (await getModule())?.LocalNotifications;
  if (!ln) return;
  try { await ln.cancel({ notifications: [{ id: NOTIF_ID }] }); } catch { /* ignore */ }
}
