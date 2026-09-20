'use client';

import { useSyncExternalStore } from 'react';

/**
 * The basket is a per-browser list of proposal keys. Paying calls the existing approve action
 * for each key (see ADR 0004). Nothing here talks to the server.
 */
const KEY = 'dearly-basket';
const EVENT = 'dearly-basket-change';
const EMPTY: readonly string[] = [];
let cachedRaw: string | null = null;
let cachedValue: readonly string[] = EMPTY;

function read(): readonly string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cachedValue = Array.isArray(parsed)
      ? parsed.filter((k): k is string => typeof k === 'string')
      : EMPTY;
    return cachedValue;
  } catch {
    return EMPTY;
  }
}

function write(keys: readonly string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(keys));
  } catch {
    // storage unavailable: the basket lives for this page only
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('storage', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useBasket() {
  const keys = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    keys,
    count: keys.length,
    has: (key: string) => keys.includes(key),
    add: (key: string) => {
      if (!read().includes(key)) write([...read(), key]);
    },
    remove: (key: string) => write(read().filter((k) => k !== key)),
    clear: () => write([]),
  };
}
