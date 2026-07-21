/* eslint-disable @typescript-eslint/no-redeclare -- Zod idiom: a schema value
   and its inferred type intentionally share a name (value vs. type space). */
import { z } from 'zod';

/**
 * SQLite has no boolean type; 0/1 integers are validated then mapped to real
 * booleans for the domain models. Row schemas validate raw DB output at the JS
 * boundary (Doc 05); domain types are what the app consumes.
 */
const sqliteBool = z
  .union([z.literal(0), z.literal(1)])
  .transform((v) => v === 1);

export const StatusType = z.enum(['image', 'video']);
export type StatusType = z.infer<typeof StatusType>;

export const SavedSource = z.enum(['whatsapp', 'business', 'quote']);
export type SavedSource = z.infer<typeof SavedSource>;

// ---- saved_items ----------------------------------------------------------

export const SavedItemRow = z.object({
  id: z.string(),
  type: StatusType,
  source: SavedSource,
  local_uri: z.string(),
  origin_name: z.string().nullable(),
  size_bytes: z.number(),
  duration_ms: z.number().nullable(),
  thumb_uri: z.string().nullable(),
  saved_at: z.number(),
  origin_modified_at: z.number().nullable(),
});
export type SavedItemRow = z.infer<typeof SavedItemRow>;

export type SavedItem = {
  id: string;
  type: StatusType;
  source: SavedSource;
  localUri: string;
  originName: string | null;
  sizeBytes: number;
  durationMs: number | null;
  thumbUri: string | null;
  savedAt: number;
  originModifiedAt: number | null;
};

export function mapSavedItem(row: SavedItemRow): SavedItem {
  return {
    id: row.id,
    type: row.type,
    source: row.source,
    localUri: row.local_uri,
    originName: row.origin_name,
    sizeBytes: row.size_bytes,
    durationMs: row.duration_ms,
    thumbUri: row.thumb_uri,
    savedAt: row.saved_at,
    originModifiedAt: row.origin_modified_at,
  };
}

// ---- tracked_contacts -----------------------------------------------------

export const TrackedContactRow = z.object({
  id: z.string(),
  label: z.string().nullable(),
  match_key: z.string(),
  avatar_uri: z.string().nullable(),
  alerts_enabled: sqliteBool,
  created_at: z.number(),
});
export type TrackedContactRow = z.infer<typeof TrackedContactRow>;

export type TrackedContact = {
  id: string;
  label: string | null;
  matchKey: string;
  avatarUri: string | null;
  alertsEnabled: boolean;
  createdAt: number;
};

export function mapTrackedContact(row: TrackedContactRow): TrackedContact {
  return {
    id: row.id,
    label: row.label,
    matchKey: row.match_key,
    avatarUri: row.avatar_uri,
    alertsEnabled: row.alerts_enabled,
    createdAt: row.created_at,
  };
}

// ---- seen_status_hashes ---------------------------------------------------

export const SeenStatusHashRow = z.object({
  hash: z.string(),
  contact_key: z.string().nullable(),
  first_seen_at: z.number(),
  notified: sqliteBool,
});
export type SeenStatusHashRow = z.infer<typeof SeenStatusHashRow>;

export type SeenStatusHash = {
  hash: string;
  contactKey: string | null;
  firstSeenAt: number;
  notified: boolean;
};

export function mapSeenStatusHash(row: SeenStatusHashRow): SeenStatusHash {
  return {
    hash: row.hash,
    contactKey: row.contact_key,
    firstSeenAt: row.first_seen_at,
    notified: row.notified,
  };
}

// ---- quotes ---------------------------------------------------------------

export const QuoteRow = z.object({
  id: z.string(),
  category: z.string(),
  text: z.string(),
  bg_style: z.string(),
  is_favorite: sqliteBool,
});
export type QuoteRow = z.infer<typeof QuoteRow>;

export type Quote = {
  id: string;
  category: string;
  text: string;
  bgStyle: string;
  isFavorite: boolean;
};

export function mapQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    category: row.category,
    text: row.text,
    bgStyle: row.bg_style,
    isFavorite: row.is_favorite,
  };
}

/** Shape of a single entry in `assets/quotes.json` (seed data, unfavorited). */
export const SeedQuote = z.object({
  id: z.string(),
  category: z.string(),
  text: z.string(),
  bg_style: z.string(),
});
export type SeedQuote = z.infer<typeof SeedQuote>;
export const SeedQuotes = z.array(SeedQuote);
