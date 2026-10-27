// In-flight session state — which day is active, the set/perf buffers, and
// the warm-up checklist. Persisted to localStorage so an Android Chrome
// reload (or PWA relaunch) restores a half-finished workout intact.
// Flushed to localdb on Finish.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSessionStore = create(
  persist(
    (set) => ({
      dayId: null,              // 'gymA' | 'gymB' | 'impact' | null (no active session)
      setsBuffer: [],
      perfBuffer: [],
      warmupChecked: [],
      sessionStartedAt: null,
      sessionEndedAt: null,
      impactSets: 0,            // impact session: sets of ten completed so far

      startSession: (dayId) =>
        set({
          dayId,
          setsBuffer: [],
          perfBuffer: [],
          warmupChecked: [],
          sessionStartedAt: new Date().toISOString(),
          sessionEndedAt: null,
          impactSets: 0,
        }),

      setImpactSets: (n) => set({ impactSets: Math.max(0, n) }),

      markSessionEnd: () => set({ sessionEndedAt: new Date().toISOString() }),

      pushSet: (record) => set((s) => ({ setsBuffer: [...s.setsBuffer, record] })),
      pushPerf: (record) => set((s) => ({ perfBuffer: [...s.perfBuffer, record] })),

      setWarmupChecked: (idx, checked) =>
        set((s) => {
          const next = new Set(s.warmupChecked);
          if (checked) next.add(idx); else next.delete(idx);
          return { warmupChecked: [...next] };
        }),

      resetSession: () =>
        set({
          dayId: null,
          setsBuffer: [],
          perfBuffer: [],
          warmupChecked: [],
          sessionStartedAt: null,
          sessionEndedAt: null,
          impactSets: 0,
        }),
    }),
    {
      name: 'wolfram-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
