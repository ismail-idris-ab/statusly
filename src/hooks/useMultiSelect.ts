import { useCallback, useState } from 'react';

type MultiSelect = {
  active: boolean;
  selected: Set<string>;
  count: number;
  /** Enter select mode with an initial key (from a long-press). */
  enter: (key: string) => void;
  toggle: (key: string) => void;
  clear: () => void;
};

/**
 * Multi-select state shared by the Status and Saved grids (Doc 03 — S6).
 * Long-press enters; tapping toggles; clearing exits the mode.
 */
export function useMultiSelect(): MultiSelect {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const enter = useCallback((key: string) => {
    setActive(true);
    setSelected(new Set([key]));
  }, []);

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setActive(false);
    setSelected(new Set());
  }, []);

  return { active, selected, count: selected.size, enter, toggle, clear };
}
