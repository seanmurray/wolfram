import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { BottomNav } from './components/BottomNav';
import { AppHeader } from './components/AppHeader';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RestTimer } from './components/RestTimer';
import { PostSessionSheet } from './components/PostSessionSheet';
import { useSessionStore } from './stores/sessionStore';
import { useSettingsStore } from './stores/settingsStore';
import { useSlotStore } from './stores/slotStore';
import { saveSession } from './lib/localdb';
import { DAYS, WARMUP } from './data/program';

// Persist the active bottom-nav tab so an Android Chrome reload restores it.
const TAB_KEY = 'wolfram-tab';
const VALID_TABS = ['today', 'workout', 'history', 'settings'];
function readPersistedTab() {
  try {
    const v = localStorage.getItem(TAB_KEY);
    return VALID_TABS.includes(v) ? v : 'today';
  } catch {
    return 'today';
  }
}

export default function App() {
  const [tab, setTab] = useState(readPersistedTab);
  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* ignore */ }
  }, [tab]);

  const [saving, setSaving] = useState(false);
  const [finishSheetOpen, setFinishSheetOpen] = useState(false);

  const onboarded = useSettingsStore((s) => s.onboarded);
  const startSession = useSessionStore((s) => s.startSession);
  const resetSession = useSessionStore((s) => s.resetSession);
  const markSessionEnd = useSessionStore((s) => s.markSessionEnd);
  const clearTodaySlots = useSlotStore((s) => s.clearToday);

  if (!onboarded) {
    return <OnboardingScreen />;
  }

  const handleStart = (dayId) => {
    startSession(dayId);
    clearTodaySlots();
    setTab('workout');
  };

  const handleFinish = () => {
    if (saving) return;
    markSessionEnd();
    setFinishSheetOpen(true);
  };

  const handleConfirmFinish = ({ sessionRpe, energy }) => {
    if (saving) return;
    setSaving(true);
    const s = useSessionStore.getState();
    const day = s.dayId ? DAYS[s.dayId] : null;
    const warmupTotal = day?.kind === 'move' ? (day.mobility?.length ?? 0) : WARMUP.length;

    const result = saveSession({
      dayId: s.dayId,
      dayLabel: day?.name ?? 'Workout',
      sessionRpe,
      energy,
      setsBuffer: s.setsBuffer,
      perfBuffer: s.perfBuffer,
      warmupChecked: s.warmupChecked,
      warmupTotal,
      sessionStartedAt: s.sessionStartedAt,
      sessionEndedAt: s.sessionEndedAt,
    });
    setSaving(false);

    if (!result.ok) {
      alert('Save failed: ' + (result.error?.message ?? 'unknown error'));
      return;
    }

    setFinishSheetOpen(false);
    queryClient.invalidateQueries();
    resetSession();
    clearTodaySlots();
    setTab('history');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppHeader />
      <div hidden={tab !== 'today'}>
        <TodayScreen onStart={handleStart} />
      </div>
      <div hidden={tab !== 'workout'}>
        <WorkoutScreen onFinish={handleFinish} />
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
      <BottomNav active={tab} onChange={setTab} />
    </QueryClientProvider>
  );
}
