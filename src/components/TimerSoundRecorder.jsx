import { useRef, useState } from 'react';
import styles from './TimerSoundRecorder.module.css';
import {
  getTimerSound, setTimerSound, clearTimerSound, playTimerSound,
} from '../lib/timerSound';

const MAX_SECONDS = 5;

// Settings control to record or upload a custom rest-timer end sound (e.g. your
// own voice). Foreground-only playback — see lib/timerSound.
export function TimerSoundRecorder() {
  const [hasSound, setHasSound] = useState(() => !!getTimerSound());
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');
  const mrRef = useRef(null);
  const stopTimerRef = useRef(null);
  const fileRef = useRef(null);

  const save = (dataUrl) => {
    const res = setTimerSound(dataUrl);
    if (res.ok) { setHasSound(true); setStatus('Saved ✓'); }
    else setStatus(res.error);
  };

  const startRecording = async () => {
    setStatus('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('Recording is not supported in this browser — upload a file instead.');
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus('Microphone permission denied.');
      return;
    }
    const mr = new MediaRecorder(stream);
    const chunks = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearTimeout(stopTimerRef.current);
      setRecording(false);
      const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => save(String(reader.result));
      reader.onerror = () => setStatus('Could not read the recording.');
      reader.readAsDataURL(blob);
    };
    mrRef.current = mr;
    mr.start();
    setRecording(true);
    setStatus(`Recording… (auto-stops at ${MAX_SECONDS}s)`);
    stopTimerRef.current = setTimeout(() => {
      if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop();
    }, MAX_SECONDS * 1000);
  };

  const stopRecording = () => {
    if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop();
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatus('');
    const reader = new FileReader();
    reader.onload = () => save(String(reader.result));
    reader.onerror = () => setStatus('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const remove = () => { clearTimerSound(); setHasSound(false); setStatus('Removed.'); };

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>Custom end sound</div>
      <div className={styles.sub}>
        Record your voice or upload a clip. Plays when a rest ends —
        while the app is open.
      </div>

      <div className={styles.row}>
        {recording ? (
          <button type="button" className={`${styles.btn} ${styles.stop}`} onClick={stopRecording}>
            ■ Stop
          </button>
        ) : (
          <button type="button" className={styles.btn} onClick={startRecording}>
            ● Record
          </button>
        )}
        <button type="button" className={styles.btn} onClick={() => fileRef.current?.click()}>
          Upload
        </button>
        {hasSound && !recording && (
          <>
            <button type="button" className={styles.btn} onClick={() => playTimerSound()}>▶ Preview</button>
            <button type="button" className={`${styles.btn} ${styles.remove}`} onClick={remove}>Remove</button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          onChange={onFile}
          style={{ display: 'none' }}
        />
      </div>

      <div className={styles.statusRow}>
        {hasSound && !recording && !status && <span className={styles.set}>Custom sound set ✓</span>}
        {status && <span className={recording ? styles.rec : styles.msg}>{status}</span>}
      </div>
    </div>
  );
}
