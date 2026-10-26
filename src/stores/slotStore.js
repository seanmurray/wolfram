// Manual exercise swaps layered over the automatic equipment resolution.
//
// Two scopes:
//   today  — swap for THIS session only. Cleared on start/finish.
//   always — a standing preference ("I'd rather do step-ups than split
//            squats"). Persisted until cleared.
//
// A slot is keyed by its ROLE (e.g. 'a:squat'). A choice is { key } (a
// variant from the slot's chain) or { custom: 'Name' } (off-menu entry).
// Precedence: today > always > equipment resolution.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSlotStore = create(
  persist(
    (set, get) => ({
      today: {},   // slotId → choice   (session scope, not persisted)
      always: {},  // slotId → choice   (persisted preference)

      swapToday: (slotId, choice) =>
        set((s) => {
          const always = { ...s.always }; delete always[slotId];
          return { today: { ...s.today, [slotId]: choice }, always };
        }),

      swapAlways: (slotId, choice) =>
        set((s) => {
          const today = { ...s.today }; delete today[slotId];
          return { today, always: { ...s.always, [slotId]: choice } };
        }),

      clearSlot: (slotId) =>
        set((s) => {
          const today = { ...s.today }; delete today[slotId];
          const always = { ...s.always }; delete always[slotId];
          return { today, always };
        }),

      clearToday: () => set({ today: {} }),

      getChoice: (slotId) => get().today[slotId] ?? get().always[slotId] ?? null,
    }),
    {
      name: 'wolfram-slots',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ always: s.always }),
    }
  )
);
