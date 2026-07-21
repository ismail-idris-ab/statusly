// In-memory MMKV stub for tests (see jest moduleNameMapper).
type Stored = string | number | boolean;

export class MMKV {
  // Extra constructor args (e.g. `{ id }`) are accepted and ignored by JS.
  private store = new Map<string, Stored>();

  set(key: string, value: Stored): void {
    this.store.set(key, value);
  }

  getString(key: string): string | undefined {
    const value = this.store.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.store.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.store.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clearAll(): void {
    this.store.clear();
  }
}
