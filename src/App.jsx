import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { BottomNav } from './components/BottomNav';
import { AppHeader } from './components/AppHeader';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { ClassesScreen } from './screens/ClassesScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RestTimer } from './components/RestTimer';
import { PostSessionSheet } from './components/PostSessionSheet';
import { LogClassSheet } from './components/LogClassSheet';
import { useSessionStore } from './stores/sessionStore';
import { useSettingsStore } from './stores/settingsStore';
import { useSlotStore } from './stores/slotStore';
import { useRestTimer } from './stores/restTimerStore';
import { saveSession, getSessions } from './lib/localdb';
import { impactLevel } from './lib/plan.js';
import { EX } from './data/exercises';
import {
  DAYS, WARMUP, IMPACT_LEVELS, IMPACT_LEVEL_EVERY, MIN_JUMPS_TO_COUNT,
} from './data/program';

// Persist the active bottom-nav tab so a reload restores it.
const TAB_KEY = 'wolfram-tab';
const VALID_TABS = ['today', 'workout', 'classes', 'history', 'settings'];
function readPersistedTab() {
  try {
    const v = localStorage.getItem(TAB_KEY);
    return VALID_TABS.includes(v) ? v : 'today';
  } catch {
    return 'today';
  }
}

// What a finished home-gym session counts as: Heavy if any lift was logged,
// plus Impact if any set came from an exercise with a landing in it.
function gymBuckets(setsBuffer) {
  if (!setsBuffer.length) return [];
  const impact = setsBuffer.some((s) => EX[s.exercise_key]?.impact);
  return impact ? ['heavy', 'impact'] : ['heavy'];
}

export default function App() {
  const [tab, setTab] = useState(readPersistedTab);
  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* ignore */ }
  }, [tab]);

  const [saving, setSaving] = useState(false);
  const [finishSheetOpen, setFinishSheetOpen] = useState(false);
  const [logSheet, setLogSheet] = useState({ open: false, classId: null });

  const onboarded = useSettingsStore((s) => s.onboarded);
  const lowBoneDensity = useSettingsStore((s) => s.lowBoneDensity);
  const startSession = useSessionStore((s) => s.startSession);
  const resetSession = useSessionStore((s) => s.resetSession);
  const markSessionEnd = useSessionStore((s) => s.markSessionEnd);
  const clearTodaySlots = useSlotStore((s) => s.clearToday);
  const skipTimer = useRestTimer((t) => t.skip);

  if (!onboarded) {
    return <OnboardingScreen />;
  }

  const afterSave = (nextTab) => {
    queryClient.invalidateQueries();
    resetSession();
    clearTodaySlots();
    skipTimer();
    setTab(nextTab);
  };

  const handleStart = (dayId) => {
    startSession(dayId);
    clearTodaySlots();
    setTab('workout');
  };

  // Impact sets save on the spot: a five-minute set doesn't need an effort
  // survey. Fewer than MIN_JUMPS_TO_COUNT is logged but earns no credit; zero
  // jumps is a cancel.
  const finishImpact = () => {
    const s = useSessionStore.getState();
    if (s.jumps === 0) { afterSave('today'); return; }
    const level = IMPACT_LEVELS[impactLevel(getSessions(), {
      levels: IMPACT_LEVELS.length, every: IMPACT_LEVEL_EVERY, capLow: lowBoneDensity,
    })];
    const now = new Date().toISOString();
    const result = saveSession({
      kind: 'impact',
      buckets: s.jumps >= MIN_JUMPS_TO_COUNT ? ['impact'] : [],
      dayId: 'impact',
      dayLabel: `${DAYS.impact.name} · ${level.name.toLowerCase()}`,
      perfBuffer: [{
        exercise_key: 'impact_set',
        exercise_name: level.name,
        notes: `${s.jumps} jumps`,
        effort_rpe: null,
        performed_at: now,
      }],
      sessionStartedAt: s.sessionStartedAt,
      sessionEndedAt: now,
    });
    if (!result.ok) { alert('Save failed: ' + (result.error?.message ?? 'unknown error')); return; }
    afterSave('today');
  };

  const handleFinish = () => {
    if (saving) return;
    const { dayId, setsBuffer } = useSessionStore.getState();
    if (dayId === 'impact') { finishImpact(); return; }
    // Nothing logged = started by mistake: discard rather than save an empty
    // row (same rule as an impact set with zero jumps).
    if (setsBuffer.length === 0) { afterSave('today'); return; }
    markSessionEnd();
    setFinishSheetOpen(true);
  };

  const handleConfirmFinish = ({ sessionRpe, energy }) => {
    if (saving) return;
    setSaving(true);
    const s = useSessionStore.getState();
    const day = s.dayId ? DAYS[s.dayId] : null;

    const result = saveSession({
      kind: 'gym',
      buckets: gymBuckets(s.setsBuffer),
      dayId: s.dayId,
      dayLabel: day?.name ?? 'Workout',
      sessionRpe,
      energy,
      setsBuffer: s.setsBuffer,
      perfBuffer: s.perfBuffer,
      warmupChecked: s.warmupChecked,
      warmupTotal: WARMUP.length,
      sessionStartedAt: s.sessionStartedAt,
      sessionEndedAt: s.sessionEndedAt,
    });
    setSaving(false);

    if (!result.ok) {
      alert('Save failed: ' + (result.error?.message ?? 'unknown error'));
      return;
    }
    setFinishSheetOpen(false);
    afterSave('today');
  };

  const handleLogClass = (payload) => {
    const result = saveSession(payload);
    if (!result.ok) {
      alert('Save failed: ' + (result.error?.message ?? 'unknown error'));
      return;
    }
    setLogSheet({ open: false, classId: null });
    queryClient.invalidateQueries();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppHeader />
      <div hidden={tab !== 'today'}>
        <TodayScreen
          onStart={handleStart}
          onLogClass={(classId) => setLogSheet({ open: true, classId })}
          onOpenClasses={() => setTab('classes')}
        />
      </div>
      <div hidden={tab !== 'workout'}>
        <WorkoutScreen onFinish={handleFinish} />
      </div>
      <div hidden={tab !== 'classes'}>
        <ClassesScreen />
      </div>
      <div hidden={tab !== 'history'}>
        <HistoryScreen />
      </div>
      <div hidden={tab !== 'settings'}>
        <SettingsScreen />
      </div>

      <RestTimer />
      <PostSessionSheet
        open={finishSheetOpen}
        saving={saving}
        onCancel={() => setFinishSheetOpen(false)}
        onConfirm={handleConfirmFinish}
      />
      <LogClassSheet
        open={logSheet.open}
        initialClassId={logSheet.classId}
        onCancel={() => setLogSheet({ open: false, classId: null })}
        onSave={handleLogClass}
      />
      <BottomNav active={tab} onChange={setTab} />
    </QueryClientProvider>
  );
}
