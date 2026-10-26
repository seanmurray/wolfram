// The class library: the recurring classes the user takes or could take,
// entered once. The weekly planner reads it to say which ones to book.
// Plus this week's "can't make it" days, which expire with the week.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { weekKey } from '../lib/week.js';

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);

export const useClassStore = create(
  persist(
    (set, get) => ({
      // [{ id, name, studio, weekday (0 = Mon), time 'HH:MM', format }]
      library: [],

      addClass: (c) => set((s) => ({ library: [...s.library, { ...c, id: uid() }] })),
      updateClass: (id, patch) =>
        set((s) => ({ library: s.library.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeClass: (id) => set((s) => ({ library: s.library.filter((c) => c.id !== id) })),

      // { week: 'YYYY-MM-DD' (that Monday), days: [weekday, ...] }
      skip: { week: null, days: [] },
      skipDaysFor: (now) => {
        const { skip } = get();
        return skip.week === weekKey(now) ? skip.days : [];
      },
      toggleSkipDay: (weekday, now = new Date()) =>
        set((s) => {
          const week = weekKey(now);
          const days = s.skip.week === week ? s.skip.days : [];
          return {
            skip: {
              week,
              days: days.includes(weekday) ? days.filter((d) => d !== weekday) : [...days, weekday],
            },
          };
        }),
    }),
    {
      name: 'wolfram-classes',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
