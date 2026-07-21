import { create } from 'zustand';

import type { StatusFile } from '@/native/StatusAccessModule';

/**
 * Holds the currently displayed (filtered) status list so the full-screen
 * viewer can page across the same items the grid shows, by index.
 */
type StatusStore = {
  items: StatusFile[];
  setItems: (items: StatusFile[]) => void;
};

export const useStatusStore = create<StatusStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));
