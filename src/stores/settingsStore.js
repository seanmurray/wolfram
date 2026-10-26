// Settings: onboarding state, the home-gym equipment list, weekly targets,
// the low-bone-density setting, timer prefs. Persisted to localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HOME_GYM_PRESET } from '../data/program';
import { DEFAULT_TARGETS, TARGET_LIMITS, DEFAULT_AVAILABILITY } from '../lib/plan.js';

const initialTimerPrefs = {
  autoStart: true,
  audio: true,
  vibrate: true,
  keepAwake: true,
};

const clampTarget = (key, n) => {
  const { min, max } = TARGET_LIMITS[key];
  return Math.max(min, Math.min(max, Math.round(n)));
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      onboarded: false,
      completeOnboarding: () => set({ onboarded: true }),

      // The home gym's kit: the only place the heavy session runs.
      equipment: HOME_GYM_PRESET,
      toggleEquipment: (id) =>
        set((s) => ({
          equipment: s.equipment.includes(id)
            ? s.equipment.filter((e) => e !== id)
            : [...s.equipment, id],
        })),

      // Weekly targets: defaults from the spec, every one a slider.
      targets: DEFAULT_TARGETS,
      setTarget: (key, n) => set((s) => ({ targets: { ...s.targets, [key]: clampTarget(key, n) } })),

      // When classes are realistic (see DEFAULT_AVAILABILITY in lib/plan.js).
      // The alternating-weekend anchor is answered on the device, never
      // preset: which weekends are free is the user's own information.
      availability: DEFAULT_AVAILABILITY,
      setAvailability: (patch) => set((s) => ({ availability: { ...s.availability, ...patch } })),

      // "I've been told I have low bone density, or had a fracture from a
      // minor fall": impact sets stay at the first level.
      lowBoneDensity: false,
      setLowBoneDensity: (v) => set({ lowBoneDensity: !!v }),

      timerPrefs: initialTimerPrefs,
      setTimerPref: (key, value) =>
        set((s) => ({ timerPrefs: { ...s.timerPrefs, [key]: value } })),
    }),
    {
      name: 'wolfram-settings',
      storage: createJSONStorage(() => localStorage),
      // v1: Wolfram's own shape. Anything older came from the Perennial
      // scaffold (a generic equipment list, a days-per-week goal), so it
      // resets to the home-gym preset and default targets.
      version: 1,
      migrate: (state, from) =>
        from < 1
          ? { ...state, equipment: HOME_GYM_PRESET, targets: DEFAULT_TARGETS, weeklyGoal: undefined }
          : state,
    }
  )
);
