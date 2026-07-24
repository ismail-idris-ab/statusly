import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  listStatuses,
  type StatusFile,
  type StatusSource,
} from '@/native/StatusAccessModule';

export type StatusFilter = 'image' | 'video';
export type LoadPhase = 'loading' | 'ready' | 'error';

type UseStatuses = {
  phase: LoadPhase;
  items: StatusFile[];
  refreshing: boolean;
  refresh: () => void;
  reload: () => void;
};

/**
 * Loads WhatsApp statuses (newest first) and applies the image/video filter.
 * Surfaces loading / ready / error phases and pull-to-refresh for the Status
 * screen (Doc 03 states).
 */
export function useStatuses(
  source: StatusSource,
  filter: StatusFilter,
): UseStatuses {
  const [all, setAll] = useState<StatusFile[]>([]);
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setPhase('loading');
      }
      try {
        const files = await listStatuses(source);
        setAll(files);
        setPhase('ready');
      } catch {
        setPhase('error');
      } finally {
        setRefreshing(false);
      }
    },
    [source],
  );

  useEffect(() => {
    // Intentional fetch-on-mount: load() flips to a loading state, then to
    // ready/error after the async native call resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
  }, [load]);

  const items = useMemo(
    () => all.filter((f) => f.type === filter),
    [all, filter],
  );

  return {
    phase,
    items,
    refreshing,
    refresh: () => void load(true),
    reload: () => void load(false),
  };
}
