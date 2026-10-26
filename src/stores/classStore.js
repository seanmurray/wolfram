// The class library: the recurring classes the user takes or could take,
// entered once. The weekly planner reads it to say which ones to book.
// Plus this week's per-day overrides ("can't go" on a usual day, "I can go"
// on an unusual one), which expire with the week.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { weekKey } from '../lib/week.js';

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);

export const useClassStore = create(
  persist(
    (set) => ({
      // [{ id, name, studio, weekday (0 = Mon), time 'HH:MM', format }]
      library: [],

      addClass: (c) => set((s) => ({ library: [...s.library, { ...c, id: uid() }] })),
      updateClass: (id, patch) =>
        set((s) => ({ library: s.library.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeClass: (id) => set((s) => ({ library: s.library.filter((c) => c.id !== id) })),

      // { week: 'YYYY-MM-DD' (that Monday), byDay: { [weekday]: 'skip' | 'go' } }
      overrides: { week: null, byDay: {} },

      // Tapping a day flips it against its usual availability: a usual day
      // becomes 'skip', an unavailable one becomes 'go'. Tapping again clears.
      toggleOverride: (weekday, usuallyAvailable, now = new Date()) =>
        set((s) => {
          const week = weekKey(now);
          const byDay = { ...(s.overrides.week === week ? s.overrides.byDay : {}) };
          if (byDay[weekday]) delete byDay[weekday];
          else byDay[weekday] = usuallyAvailable ? 'skip' : 'go';
          return { overrides: { week, byDay } };
        }),
    }),
    {
      name: 'wolfram-classes',
      storage: createJSONStorage(() => localStorage),
      // v1: overrides replace the one-way skip list ({ week, days: [] }).
      version: 1,
      migrate: (state, from) => {
        if (from < 1) {
          const byDay = Object.fromEntries((state.skip?.days ?? []).map((d) => [d, 'skip']));
          const { skip, ...rest } = state;
          return { ...rest, overrides: { week: skip?.week ?? null, byDay } };
        }
        return state;
      },
    }
  )
);

// This week's overrides, or none if they belong to an earlier week.
export function overridesFor(state, now = new Date()) {
  return state.overrides.week === weekKey(now) ? state.overrides.byDay : {};
}
