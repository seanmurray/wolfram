// Local-first storage — ALL of the user's data lives on their device.
//
// No backend, no account, nothing leaves the phone. Four collections in
// localStorage (sessions / sets / perf / notes), shaped like the rows the UI
// components were built around so history and last-session seeding work
// unchanged.
//
// ─── DURABILITY ────────────────────────────────────────────────────────────
// There is no server to fall back on, so the storage layer has to be careful:
//
//   1. Corruption never masquerades as "no data". A failed JSON.parse used to
//      return an empty array, which made the app look brand new — and the next
//      save would happily overwrite the damaged-but-possibly-recoverable blob.
//      Now a bad parse quarantines the raw string and throws, so we recover
//      instead of destroying.
//   2. Writes are all-or-nothing. A session, its sets, and its perf rows are
//      three separate keys; a quota failure partway through used to leave a
//      session with no sets. Now every multi-key write snapshots first,
//      verifies by reading back, and rolls back completely on any failure.
//   3. Two copies, two mediums. After every successful write we keep a
//      last-known-good snapshot in localStorage and mirror the whole database
//      to IndexedDB (which browsers evict far less readily). On boot, if the
//      primary keys are missing or corrupt, we restore from whichever copy is
//      newer — automatically, before React renders.
//   4. Quota is visible before it bites (see storageInfo), and Settings nags
//      for a manual export once enough new sessions have piled up.

import { writeDataFile, readDataFile } from './nativeFile.js';

const PREFIX = 'wolfram-';
const KEYS = {
  sessions: PREFIX + 'sessions',
  sets: PREFIX + 'sets',
  perf: PREFIX + 'perf',
  notes: PREFIX + 'notes',
};
const SNAPSHOT_KEY = PREFIX + 'snapshot';
const LAST_EXPORT_KEY = PREFIX + 'last-export';
const COLLECTIONS = ['sessions', 'sets', 'perf', 'notes'];
const EMPTY = { sessions: [], sets: [], perf: [], notes: {} };

// Preference stores owned by Zustand. They sit outside the four collections,
// but a backup or a recovery that loses them would drop the user's equipment list,
// class library, and standing exercise swaps — so they ride along. The in-progress session
// buffer ('wolfram-session') is deliberately excluded: restoring a
// half-finished workout onto another device is noise, not data.
const PREF_KEYS = [PREFIX + 'settings', PREFIX + 'slots', PREFIX + 'classes'];

export const BACKUP_FORMAT = { app: 'wolfram', version: 1 };

const uuid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);

// ── Low-level reads ────────────────────────────────────────────────────────

// Throws CorruptedError when the stored value exists but won't parse, so the
// caller can recover rather than silently treating it as empty.
class CorruptedError extends Error {}

function readKey(key, fallback) {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback; // storage blocked entirely (private mode, etc.)
  }
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    quarantine(key, raw);
    throw new CorruptedError(key);
  }
}

// Park a damaged blob under its own key so it's inspectable/recoverable and
// can never be silently overwritten.
function quarantine(key, raw) {
  try {
    localStorage.setItem(`${PREFIX}corrupt-${Date.now()}-${key}`, raw);
  } catch { /* nothing more we can do */ }
}

// Read a collection, self-healing from the snapshot if the primary is corrupt.
function readCollection(name) {
  try {
    return readKey(KEYS[name], emptyLike(name));
  } catch (e) {
    if (e instanceof CorruptedError) {
      const snap = readSnapshotSafely();
      if (snap && snap[name] != null) {
        // Put the good copy back so subsequent reads are fast and consistent.
        try { localStorage.setItem(KEYS[name], JSON.stringify(snap[name])); } catch { /* ignore */ }
        return snap[name];
      }
      return emptyLike(name);
    }
    throw e;
  }
}

// Fresh empty value of the right shape — never hand out the shared EMPTY
// objects, which callers spread into and would otherwise accumulate state.
function emptyLike(name) {
  return Array.isArray(EMPTY[name]) ? [] : {};
}

function readSnapshotSafely() {
  return readSnapshotRecord()?.data ?? null;
}

// { at, data } or null.
function readSnapshotRecord() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    return snap && snap.data ? snap : null;
  } catch {
    return null;
  }
}

// ── Transactional write ────────────────────────────────────────────────────

// Apply a patch of { collectionName: value } atomically. Every key is written,
// then read back to confirm it landed; any failure restores all prior raw
// values so we never leave a half-written database behind.
function writeAll(patch) {
  const names = Object.keys(patch);
  const prior = {};
  for (const n of names) {
    try { prior[n] = localStorage.getItem(KEYS[n]); } catch { prior[n] = null; }
  }

  const rollback = () => {
    for (const n of names) {
      try {
        if (prior[n] == null) localStorage.removeItem(KEYS[n]);
        else localStorage.setItem(KEYS[n], prior[n]);
      } catch { /* ignore */ }
    }
  };

  try {
    for (const n of names) {
      const serialized = JSON.stringify(patch[n]);
      localStorage.setItem(KEYS[n], serialized);
      // Verify: a quota failure can be silent on some engines.
      if (localStorage.getItem(KEYS[n]) !== serialized) throw new Error('verify failed');
    }
  } catch {
    rollback();
    return {
      ok: false,
      error: new Error(
        'Device storage is full or unavailable. Export a backup from Settings, then remove a few old sessions.'
      ),
    };
  }

  persistBackups();
  return { ok: true };
}

// Last-known-good snapshot + IndexedDB mirror + (native) the data file.
// Best-effort and non-blocking: the primary write already succeeded, these
// are the safety nets.
function persistBackups() {
  const data = snapshotData();
  const at = new Date().toISOString();
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ at, data }));
  } catch { /* snapshot is a bonus; never fail the save for it */ }
  idbPut(data).catch(() => {});
  writeDataFile({ at, data }).catch(() => {});
}

// Preference stores (settings, classes, slot swaps) change outside localdb's
// writes, so their stores call this. Debounced: a slider drag is one backup.
let backupTimer = null;
export function backupSoon() {
  clearTimeout(backupTimer);
  backupTimer = setTimeout(persistBackups, 800);
}

function snapshotData() {
  const out = {};
  for (const n of COLLECTIONS) out[n] = readCollection(n);
  // Carry the preference stores too. If the whole origin gets evicted, a
  // recovery that restores the training log but not the equipment list would
  // dump the user back into onboarding with their history intact but the plan
  // reset to bodyweight.
  out.prefs = readPrefs();
  return out;
}

function readPrefs() {
  const prefs = {};
  for (const k of PREF_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) prefs[k] = raw;
    } catch { /* ignore */ }
  }
  return prefs;
}

function writePrefs(prefs) {
  for (const k of PREF_KEYS) {
    if (typeof prefs?.[k] === 'string') {
      try { localStorage.setItem(k, prefs[k]); } catch { /* ignore */ }
    }
  }
}

// ── IndexedDB mirror ───────────────────────────────────────────────────────
// A second copy in a store browsers evict far less aggressively than
// localStorage. Whole-database blob — small enough that granularity would be
// complexity without benefit.

const IDB_NAME = 'wolfram';
const IDB_STORE = 'backup';

function idbOpen() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('no idb'));
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(data) {
  const db = await idbOpen();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ at: new Date().toISOString(), data }, 'latest');
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet() {
  const db = await idbOpen();
  const val = await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get('latest');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return val;
}

// ── Boot recovery ──────────────────────────────────────────────────────────

// Called once before render. If localStorage lost the primary keys (eviction,
// a partial clear) but a backup survives, put the data back.
// Returns a short description when it restored something, else null.
// Nothing to recover while either the training log or the settings survive:
// settings count too, so someone who set up classes but hasn't logged a
// session yet is still protected.
function hasPrimaryData() {
  try {
    return !!localStorage.getItem(KEYS.sessions) || !!localStorage.getItem(KEYS.sets) ||
      !!localStorage.getItem(PREFIX + 'settings');
  } catch {
    return false;
  }
}

export async function recoverIfNeeded() {
  if (hasPrimaryData()) return null;

  // Every surviving copy, newest wins: the native data file, the IndexedDB
  // mirror, the localStorage snapshot.
  const copies = [];
  const file = await readDataFile().catch(() => null);
  if (file) copies.push({ ...file, from: 'app storage' });
  try {
    const mirror = await idbGet();
    if (mirror?.data) copies.push({ ...mirror, from: 'device backup' });
  } catch { /* ignore */ }
  const snap = readSnapshotRecord();
  if (snap) copies.push({ ...snap, from: 'snapshot' });
  if (!copies.length) return null;

  copies.sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')));
  const { data: candidate, from } = copies[0];
  const count = candidate.sessions?.length ?? 0;
  const hasPrefs = Object.keys(candidate.prefs ?? {}).length > 0;
  if (count === 0 && !(candidate.sets?.length) && !hasPrefs) return null;

  try {
    for (const n of COLLECTIONS) {
      if (candidate[n] != null) localStorage.setItem(KEYS[n], JSON.stringify(candidate[n]));
    }
  } catch {
    return null;
  }
  writePrefs(candidate.prefs);
  return { restored: count, from, prefs: hasPrefs };
}

// ── Sessions ───────────────────────────────────────────────────────────────

export function getSessions() {
  return readCollection('sessions')
    .slice()
    .sort((a, b) => (b.performed_at ?? '').localeCompare(a.performed_at ?? ''));
}

// payload: { dayId, dayLabel, sessionRpe, energy, setsBuffer, perfBuffer,
//            warmupChecked, warmupTotal, sessionStartedAt, sessionEndedAt,
//            kind, buckets, performedAt?, classId?, format?, wentHeavy?, studio? }
//
// kind + buckets drive the weekly tally (lib/plan.js): kind is where the
// session came from ('gym' | 'impact' | 'class'), buckets what it counted as.
// performedAt lets a class be logged after the fact, on the day it happened.
export function saveSession(payload) {
  const id = uuid();
  const now = new Date().toISOString();

  const session = {
    id,
    performed_at: payload.performedAt ?? now,
    kind: payload.kind ?? null,
    buckets: payload.buckets ?? [],
    class_id: payload.classId ?? null,
    format: payload.format ?? null,
    went_heavy: payload.wentHeavy ?? null,
    studio: payload.studio ?? null,
    day_id: payload.dayId ?? null,
    day_label: payload.dayLabel ?? 'Workout',
    session_rpe: payload.sessionRpe ?? null,
    energy: payload.energy ?? null,
    sets_logged: payload.setsBuffer?.length ?? 0,
    exercises_logged: new Set((payload.setsBuffer ?? []).map((s) => s.exercise_key)).size,
    perf_logged: payload.perfBuffer?.length ?? 0,
    warmup_done: (payload.warmupChecked?.length ?? 0) >= (payload.warmupTotal ?? Infinity),
    started_at: payload.sessionStartedAt ?? null,
    ended_at: payload.sessionEndedAt ?? null,
    created_at: now,
  };

  const newSets = (payload.setsBuffer ?? []).map((s) => ({ id: uuid(), session_id: id, ...s }));
  const newPerf = (payload.perfBuffer ?? []).map((p) => ({ id: uuid(), session_id: id, ...p }));

  const res = writeAll({
    sessions: [...readCollection('sessions'), session],
    sets: [...readCollection('sets'), ...newSets],
    perf: [...readCollection('perf'), ...newPerf],
  });

  return res.ok ? { ok: true, id } : res;
}

export function deleteSession(sessionId) {
  return writeAll({
    sessions: readCollection('sessions').filter((s) => s.id !== sessionId),
    sets: readCollection('sets').filter((s) => s.session_id !== sessionId),
    perf: readCollection('perf').filter((p) => p.session_id !== sessionId),
  });
}

// ── Per-exercise history ───────────────────────────────────────────────────

export function getSetHistory(exerciseKey, limit = 3) {
  const rows = readCollection('sets')
    .filter((r) => r.exercise_key === exerciseKey)
    .sort((a, b) => (b.performed_at ?? '').localeCompare(a.performed_at ?? ''));
  const grouped = new Map();
  for (const row of rows) {
    let bucket = grouped.get(row.session_id);
    if (!bucket) {
      if (grouped.size >= limit) continue;
      bucket = { sessionId: row.session_id, performedAt: row.performed_at, sets: [] };
      grouped.set(row.session_id, bucket);
    }
    bucket.sets.push({
      set_num: row.set_num,
      actual_reps: row.actual_reps,
      actual_weight: row.actual_weight,
      rpe: row.rpe,
    });
  }
  const out = Array.from(grouped.values());
  out.forEach((b) => b.sets.sort((a, c) => (a.set_num ?? 0) - (c.set_num ?? 0)));
  return out;
}

export function getPerfHistory(exerciseKey, limit = 3) {
  const seen = new Set();
  const out = [];
  const rows = readCollection('perf')
    .filter((r) => r.exercise_key === exerciseKey)
    .sort((a, b) => (b.performed_at ?? '').localeCompare(a.performed_at ?? ''));
  for (const row of rows) {
    if (seen.has(row.session_id)) continue;
    seen.add(row.session_id);
    out.push({
      sessionId: row.session_id,
      performedAt: row.performed_at,
      exerciseName: row.exercise_name,
      effortRpe: row.effort_rpe ?? null,
      notes: row.notes ?? '',
    });
    if (out.length >= limit) break;
  }
  return out;
}

// ── Form-cue notes ─────────────────────────────────────────────────────────

export function getNotes() {
  return readCollection('notes');
}

export function setNote(exerciseKey, exerciseName, note) {
  const map = { ...readCollection('notes') };
  map[exerciseKey] = {
    exercise_key: exerciseKey,
    exercise_name: exerciseName,
    note,
    updated_at: new Date().toISOString(),
  };
  return writeAll({ notes: map });
}

// ── Backup ─────────────────────────────────────────────────────────────────

export function exportAll() {
  // snapshotData already carries prefs alongside the four collections.
  return JSON.stringify(
    { ...BACKUP_FORMAT, exported_at: new Date().toISOString(), ...snapshotData() },
    null,
    2
  );
}

export function markExported() {
  try {
    localStorage.setItem(
      LAST_EXPORT_KEY,
      JSON.stringify({ at: new Date().toISOString(), sessions: readCollection('sessions').length })
    );
  } catch { /* ignore */ }
}

// How many sessions have been logged since the last export — drives the
// gentle nudge in Settings. Null when there's nothing worth backing up.
export function unbackedUpCount() {
  const total = readCollection('sessions').length;
  if (total === 0) return null;
  let last = null;
  try {
    const raw = localStorage.getItem(LAST_EXPORT_KEY);
    last = raw ? JSON.parse(raw) : null;
  } catch { /* ignore */ }
  const since = total - (last?.sessions ?? 0);
  return since > 0 ? since : null;
}

export function importAll(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (data?.app !== BACKUP_FORMAT.app || !Array.isArray(data.sessions)) {
    return { ok: false, error: 'That does not look like a Wolfram backup.' };
  }
  const res = writeAll({
    sessions: data.sessions,
    sets: data.sets ?? [],
    perf: data.perf ?? [],
    notes: data.notes ?? {},
  });
  if (!res.ok) return { ok: false, error: res.error.message };

  // Preferences last — the training log is the irreplaceable part, so it gets
  // the transactional path; losing a restored equipment list is recoverable in
  // two taps and must never fail the import.
  writePrefs(data.prefs);

  return { ok: true, sessions: data.sessions.length };
}

// ── Storage health ─────────────────────────────────────────────────────────

// { usedMb, quotaMb, pct, persisted } — quota fields are null where the
// browser doesn't expose an estimate.
export async function storageInfo() {
  let persisted = false;
  try { persisted = await navigator.storage?.persisted?.() ?? false; } catch { /* ignore */ }

  let usedMb = null, quotaMb = null, pct = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.usage != null) {
      usedMb = est.usage / 1048576;
      if (est.quota) {
        quotaMb = est.quota / 1048576;
        pct = (est.usage / est.quota) * 100;
      }
    }
  } catch { /* ignore */ }

  return { usedMb, quotaMb, pct, persisted, sessions: readCollection('sessions').length };
}
