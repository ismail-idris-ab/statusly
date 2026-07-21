import { useCallback, useEffect, useState } from 'react';

import { getDatabase } from '@/db';
import { deleteSavedItem, listSavedItems, type SavedFilter } from '@/db/queries';
import type { SavedItem } from '@/db/types';

export type SavedPhase = 'loading' | 'ready' | 'error';

type UseSavedItems = {
  phase: SavedPhase;
  items: SavedItem[];
  reload: () => void;
  remove: (ids: string[]) => Promise<void>;
};

/** Loads the saved-items library (newest first) with delete support (Doc 03 — S5). */
export function useSavedItems(filter: SavedFilter): UseSavedItems {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [phase, setPhase] = useState<SavedPhase>('loading');

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      const db = await getDatabase();
      setItems(await listSavedItems(db, filter));
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const remove = useCallback(
    async (ids: string[]) => {
      const db = await getDatabase();
      for (const id of ids) {
        await deleteSavedItem(db, id);
      }
      await load();
    },
    [load],
  );

  return { phase, items, reload: () => void load(), remove };
}
