// A reading waiting for the Classes tab: what was shared to Wolfram from the
// share sheet, already run through lib/readClass.js. App.jsx fills it when
// the app opens or comes to the front; ClassesScreen takes it.
//
// Not persisted. Taking from the share queue clears it, so a reading is only
// lost if the app is closed before the Classes tab shows it.

import { create } from 'zustand';

export const useImportStore = create((set) => ({
  // { classes, link, studio, source: 'share' } | null
  pending: null,
  setPending: (pending) => set({ pending }),
  take: () => {
    let got = null;
    set((s) => { got = s.pending; return { pending: null }; });
    return got;
  },
}));
