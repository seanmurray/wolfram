// Native-only: the app's own iOS plugin, ClassReader (Swift, in the App
// target), which reads the text in a screenshot on the phone with Apple's
// Vision framework. Two ways in (docs/specs/class-from-screenshot.md):
//   - pickAndRead(): the system photo picker, then read the picked image;
//   - takeShared(): everything shared to Wolfram from the share sheet since
//     last time (the share extension queues it in the App Group), read and
//     cleared, images deleted.
// Lines come back as [{ text, x, y, w, h }], 0–1 from the top-left, for
// lib/readClass.js.
//
// On the web, and on a native build without the plugin, every function is a
// no-op. Results are read off the plugin's reply, never returned as the
// plugin itself: Capacitor's proxy answers `then` (PROJECT.md Incidents,
// 2026-10-26).

import { Capacitor, registerPlugin } from '@capacitor/core';
import { isNative } from './nativeFile.js';

const ClassReader = registerPlugin('ClassReader');

export function canReadScreenshots() {
  try { return isNative() && Capacitor.isPluginAvailable('ClassReader'); } catch { return false; }
}

// The picked screenshot's lines, or null if the user cancelled.
export async function readScreenshot() {
  const r = await ClassReader.pickAndRead();
  if (r?.cancelled) return null;
  return Array.isArray(r?.lines) ? r.lines : [];
}

// [{ lines } | { text }], oldest first; [] when nothing is waiting.
export async function takeShared() {
  if (!canReadScreenshots()) return [];
  try {
    const r = await ClassReader.takeShared();
    return Array.isArray(r?.items) ? r.items : [];
  } catch {
    return [];
  }
}
