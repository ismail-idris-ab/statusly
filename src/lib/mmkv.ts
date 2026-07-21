import { MMKV } from 'react-native-mmkv';

/**
 * App-wide key/value store (Doc 05 — MMKV keys). Fast, synchronous, native.
 * Full typed key catalog is completed in Phase 2; this Phase-1 wrapper provides
 * the instance plus generic typed accessors that the settings store builds on.
 */
export const storage = new MMKV({ id: 'statusly' });

export function getString(key: string): string | undefined {
  return storage.getString(key);
}

export function setString(key: string, value: string): void {
  storage.set(key, value);
}

export function getBool(key: string, fallback = false): boolean {
  const value = storage.getBoolean(key);
  return value === undefined ? fallback : value;
}

export function setBool(key: string, value: boolean): void {
  storage.set(key, value);
}

export function getNumber(key: string, fallback = 0): number {
  const value = storage.getNumber(key);
  return value === undefined ? fallback : value;
}

export function setNumber(key: string, value: number): void {
  storage.set(key, value);
}

export function remove(key: string): void {
  storage.delete(key);
}
