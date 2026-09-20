'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'system' | 'light' | 'dark';
const KEY = 'dearly-theme';
const EVENT = 'dearly-theme-change';

function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

function persist(t: Theme): void {
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  try {
    if (t === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    // storage unavailable: the stamp still applies for this page
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

/** System, light or dark. The choice stamps data-theme on the root and is remembered per browser. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => 'system' as Theme);
  const apply = (t: Theme) => persist(t);
  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex rounded-md border border-line text-xs"
    >
      {(['system', 'light', 'dark'] as Theme[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => apply(t)}
          aria-pressed={theme === t}
          className={`px-2 py-1 first:rounded-l-md last:rounded-r-md ${theme === t ? 'bg-surface-2 font-bold' : 'hover:bg-surface-2'}`}
        >
          {t === 'system' ? 'System' : t === 'light' ? 'Light' : 'Dark'}
        </button>
      ))}
    </div>
  );
}
