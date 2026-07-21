import { useCallback, useEffect, useState } from 'react';

import { getDatabase } from '@/db';
import {
  listFavoriteQuotes,
  listQuoteCategories,
  listQuotes,
  setQuoteFavorite,
} from '@/db/queries';
import type { Quote } from '@/db/types';

export const FAVORITES = 'favorites';
export type QuoteFilter = string;

type UseQuotes = {
  categories: string[];
  quotes: Quote[];
  loading: boolean;
  toggleFavorite: (quote: Quote) => Promise<void>;
};

/** Loads categories + the quotes for the active filter (a category or favorites). */
export function useQuotes(filter: QuoteFilter): UseQuotes {
  const [categories, setCategories] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const db = await getDatabase();
    setCategories(await listQuoteCategories(db));
    setQuotes(
      filter === FAVORITES
        ? await listFavoriteQuotes(db)
        : await listQuotes(db, filter),
    );
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const toggleFavorite = useCallback(
    async (quote: Quote) => {
      const db = await getDatabase();
      await setQuoteFavorite(db, quote.id, !quote.isFavorite);
      await load();
    },
    [load],
  );

  return { categories, quotes, loading, toggleFavorite };
}
