import quotesJson from '@/assets/quotes.json';

import type { SqliteAdapter } from './adapter';
import { SeedQuotes, type SeedQuote } from './types';

/** Loads and validates the bundled quotes seed (`assets/quotes.json`). */
export function loadSeedQuotes(): SeedQuote[] {
  return SeedQuotes.parse(quotesJson);
}

/**
 * Idempotently seeds the `quotes` table. Uses INSERT OR IGNORE keyed on the
 * stable seed ids, so it is safe on every launch and preserves user favorites
 * while still adding any quotes introduced in later app versions.
 * Returns the number of rows actually inserted.
 */
export async function seedQuotes(
  db: SqliteAdapter,
  seeds: SeedQuote[],
): Promise<number> {
  let inserted = 0;
  await db.withTransactionAsync(async () => {
    for (const quote of seeds) {
      const result = await db.runAsync(
        `INSERT OR IGNORE INTO quotes (id, category, text, bg_style, is_favorite)
         VALUES (?, ?, ?, ?, 0)`,
        [quote.id, quote.category, quote.text, quote.bg_style],
      );
      inserted += result.changes;
    }
  });
  return inserted;
}
