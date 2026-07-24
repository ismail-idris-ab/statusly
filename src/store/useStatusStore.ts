import { create } from 'zustand';

import type { StatusFile, StatusSource } from '@/native/StatusAccessModule';

/**
 * Holds the currently displayed (filtered) status list so the full-screen
 * viewer can page across the same items the grid shows, by index. `source`
 * tags where the list came from so the viewer's Save records the right origin
 * (WhatsApp vs Business).
 */
type StatusStore = {
  items: StatusFile[];
  source: StatusSource;
  setItems: (items: StatusFile[], source?: StatusSource) => void;
};

export const useStatusStore = create<StatusStore>((set) => ({
  items: [],
  source: 'whatsapp',
  setItems: (items, source = 'whatsapp') => set({ items, source }),
}));
