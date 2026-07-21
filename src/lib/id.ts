/**
 * RFC-4122 v4 UUID for local row ids. Intentionally pure-JS (no native module)
 * — these ids are local database keys, not security tokens, so a fast
 * `Math.random` generator is sufficient and keeps the native surface minimal.
 */
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
