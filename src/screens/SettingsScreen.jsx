import { useEffect, useRef, useState } from 'react';
import styles from './SettingsScreen.module.css';
import { EQUIPMENT } from '../data/program';
import { useSettingsStore } from '../stores/settingsStore';
import { TimerSoundRecorder } from '../components/TimerSoundRecorder';
import { exportAll, importAll, markExported, unbackedUpCount, storageInfo } from '../lib/localdb';
import { queryClient } from '../lib/queryClient';

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <label className={styles.toggleRow}>
      <div>
        <div className={styles.rowLabel}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <input
        type="checkbox"
        className={styles.toggle}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function SettingsScreen() {
  const equipment = useSettingsStore((s) => s.equipment);
  const toggleEquipment = useSettingsStore((s) => s.toggleEquipment);
  const weeklyGoal = useSettingsStore((s) => s.weeklyGoal);
  const setWeeklyGoal = useSettingsStore((s) => s.setWeeklyGoal);
  const timerPrefs = useSettingsStore((s) => s.timerPrefs);
  const setTimerPref = useSettingsStore((s) => s.setTimerPref);

  const [backupMsg, setBackupMsg] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [health, setHealth] = useState(null);
  // Read synchronously at mount — it's a localStorage read, not an effect.
  const [pending, setPending] = useState(unbackedUpCount);
  const importRef = useRef(null);
  const fileRef = useRef(null);

  const refreshHealth = () => {
    storageInfo().then(setHealth).catch(() => {});
    setPending(unbackedUpCount());
  };
  // Quota/persistence is async — set from the promise callback, not the
  // effect body.
  useEffect(() => {
    storageInfo().then(setHealth).catch(() => {});
  }, []);

  // Share → download → clipboard. Share is best on Android (straight into
  // Drive or a chat); the file download is the reliable fallback; clipboard is
  // the last resort, since a long blob is easy to lose.
  const doExport = async () => {
    const json = exportAll();
    const name = `wolfram-backup-${new Date().toISOString().slice(0, 10)}.json`;

    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Wolfram backup' });
        markExported();
        refreshHealth();
        setBackupMsg('Shared ✓');
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return; // user dismissed the sheet
    }

    try {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      markExported();
      refreshHealth();
      setBackupMsg(`Saved ${name} ✓`);
      return;
    } catch { /* fall through */ }

    try {
      await navigator.clipboard.writeText(json);
      markExported();
      refreshHealth();
      setBackupMsg('Copied to clipboard ✓ — paste it somewhere safe');
    } catch {
      setBackupMsg('Could not export automatically.');
    }
  };

  const applyImport = (json) => {
    const res = importAll(json);
    if (!res.ok) {
      setBackupMsg(res.error);
      return;
    }
    queryClient.invalidateQueries();
    refreshHealth();
    setBackupMsg(`Restored ${res.sessions} sessions ✓`);
    setImportOpen(false);
    // Equipment and standing swaps live in Zustand stores that read
    // localStorage once at init, so a reload is what actually makes the
    // restored preferences take effect.
    setTimeout(() => window.location.reload(), 900);
  };

  const doImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked twice
    if (!file) return;
    try {
      applyImport(await file.text());
    } catch {
      setBackupMsg('Could not read that file.');
    }
  };

  return (
    <main className="screen">
      <div className="overline">Make it yours</div>
      <div className="title-xl">Settings</div>

      <div className={styles.sectionLabel}>My equipment</div>
      <div className={styles.hint}>The plan re-adapts the moment you change these.</div>
      <div className={styles.group}>
        {EQUIPMENT.map((eq) => (
          <ToggleRow
            key={eq.id}
            label={eq.label}
            sub={eq.hint}
            checked={equipment.includes(eq.id)}
            onChange={() => toggleEquipment(eq.id)}
          />
        ))}
      </div>

      <div className={styles.sectionLabel}>Weekly goal</div>
      <div className={styles.goalRow}>
        <button type="button" className={styles.stepBtn} onClick={() => setWeeklyGoal(weeklyGoal - 1)} aria-label="Lower goal">−</button>
        <div className={styles.goalVal}>{weeklyGoal} days / week</div>
        <button type="button" className={styles.stepBtn} onClick={() => setWeeklyGoal(weeklyGoal + 1)} aria-label="Raise goal">+</button>
      </div>

      <div className={styles.sectionLabel}>Rest timer</div>
      <div className={styles.group}>
        <ToggleRow label="Auto-start timer" sub="Starts when a set is marked done"
          checked={timerPrefs.autoStart} onChange={(v) => setTimerPref('autoStart', v)} />
        <ToggleRow label="Sound" sub="Beeps near the end, tone at zero"
          checked={timerPrefs.audio} onChange={(v) => setTimerPref('audio', v)} />
        <ToggleRow label="Vibrate" sub="Gentle buzz on transitions"
          checked={timerPrefs.vibrate} onChange={(v) => setTimerPref('vibrate', v)} />
        <ToggleRow label="Keep screen on during rest" sub="So the phone doesn't sleep mid-timer"
          checked={timerPrefs.keepAwake !== false} onChange={(v) => setTimerPref('keepAwake', v)} />
        <TimerSoundRecorder />
      </div>

      <div className={styles.sectionLabel}>Your data</div>
      <div className={styles.hint}>
        Everything lives only on this phone — no account, no cloud. Wolfram
        keeps a spare copy on the device automatically, but that copy goes with
        the phone. Export a real backup now and then and stash it somewhere else.
      </div>

      {pending != null && pending >= 5 && (
        <div className={styles.nudge}>
          {pending} session{pending === 1 ? '' : 's'} logged since your last
          backup — good moment to export one.
        </div>
      )}

      <div className={styles.backupRow}>
        <button type="button" className={styles.backupBtn} onClick={doExport}>Export backup</button>
        <button type="button" className={styles.backupBtnAlt} onClick={() => setImportOpen((o) => !o)}>
          {importOpen ? 'Cancel import' : 'Import backup'}
        </button>
      </div>
      {importOpen && (
        <div className={styles.importBox}>
          <button type="button" className={styles.backupBtn} onClick={() => fileRef.current?.click()}>
            Choose backup file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={doImportFile}
            style={{ display: 'none' }}
          />
          <div className={styles.importOr}>or paste it</div>
          <textarea
            ref={importRef}
            className={styles.importArea}
            rows={4}
            placeholder="Paste the backup JSON here…"
          />
          <button
            type="button"
            className={styles.backupBtnAlt}
            onClick={() => applyImport(importRef.current?.value ?? '')}
          >
            Restore from pasted text
          </button>
        </div>
      )}
      {backupMsg && <div className={styles.backupMsg}>{backupMsg}</div>}

      {health && (
        <div className={styles.health}>
          {health.sessions} session{health.sessions === 1 ? '' : 's'} stored
          {health.usedMb != null && ` · ${health.usedMb.toFixed(1)} MB used`}
          {health.pct != null && health.pct >= 1 && ` of ${Math.round(health.quotaMb)} MB`}
          {' · '}
          {health.persisted
            ? 'protected from auto-cleanup'
            : 'install to the home screen for stronger protection'}
        </div>
      )}

      <p className={styles.about}>
        Wolfram · strength for the long run.
      </p>
    </main>
  );
}
