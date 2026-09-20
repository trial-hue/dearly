'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 768px)';

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** True at 768px and wider. The server snapshot assumes desktop; phones correct on hydration. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
