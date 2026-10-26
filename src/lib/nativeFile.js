// Native-only file access: the durable copy of the database, and backup
// export through the iOS share sheet.
//
// Why a file: Capacitor's storage guide warns that iOS "will reclaim local
// storage from Web Views if a device is running low on space", and IndexedDB
// likewise. The app's Documents folder is not reclaimed (and rides along in
// device backups), so every backup pass also lands there, and boot recovery
// reads it first.
//
// On the web every function is a no-op: the plugins are imported only on
// native, so the PWA bundle's behaviour is unchanged.

import { Capacitor } from '@capacitor/core';

const DATA_FILE = 'wolfram-data.json';

export function isNative() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

let fsPromise = null;
function fs() {
  if (!isNative()) return Promise.resolve(null);
  if (!fsPromise) fsPromise = import('@capacitor/filesystem').catch(() => null);
  return fsPromise;
}

// { at, data } — the same shape as the IndexedDB mirror.
export async function writeDataFile(record) {
  const m = await fs();
  if (!m) return false;
  await m.Filesystem.writeFile({
    path: DATA_FILE,
    data: JSON.stringify(record),
    directory: m.Directory.Data,
    encoding: m.Encoding.UTF8,
  });
  return true;
}

// The record, or null when there is none or it won't parse (a write cut off
// mid-way): recovery then falls back to the other copies.
export async function readDataFile() {
  const m = await fs();
  if (!m) return null;
  try {
    const r = await m.Filesystem.readFile({ path: DATA_FILE, directory: m.Directory.Data, encoding: m.Encoding.UTF8 });
    const rec = JSON.parse(r.data);
    return rec && rec.data ? rec : null;
  } catch {
    return null;
  }
}

// Writes the backup to the cache folder and opens the share sheet with it.
// Resolves true once shared; false on the web or if the sheet was dismissed
// (the plugin doesn't document how cancel is reported, so any rejection
// counts as "not exported").
export async function shareBackup(name, json) {
  const m = await fs();
  if (!m) return false;
  try {
    const { uri } = await m.Filesystem.writeFile({
      path: name,
      data: json,
      directory: m.Directory.Cache,
      encoding: m.Encoding.UTF8,
    });
    const { Share } = await import('@capacitor/share');
    await Share.share({ title: 'Wolfram backup', files: [uri] });
    return true;
  } catch {
    return false;
  }
}
