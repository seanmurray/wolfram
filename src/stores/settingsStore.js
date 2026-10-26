// Settings — equipment on hand, onboarding state, weekly goal, timer prefs.
// Persisted to localStorage; equipment can be changed any time in Settings
// and every workout slot re-resolves immediately.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialTimerPrefs = {
  autoStart: true,
  audio: true,
  vibrate: true,
  keepAwake: true,
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      // First-run: the equipment question gates the app until answered.
      onboarded: false,
      equipment: [],            // EQUIPMENT ids the user owns
      weeklyGoal: 3,            // target training days per week

      completeOnboarding: (equipment) =>
        set({ onboarded: true, equipment: [...equipment] }),

      toggleEquipment: (id) =>
        set((s) => ({
          equipment: s.equipment.includes(id)
            ? s.equipment.filter((e) => e !== id)
            : [...s.equipment, id],
        })),

      setWeeklyGoal: (n) => set({ weeklyGoal: Math.max(1, Math.min(7, n)) }),

      timerPrefs: initialTimerPrefs,
      setTimerPref: (key, value) =>
        set((s) => ({ timerPrefs: { ...s.timerPrefs, [key]: value } })),
    }),
    {
      name: 'wolfram-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
