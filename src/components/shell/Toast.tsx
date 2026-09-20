'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface ToastApi {
  toast: (message: string) => void;
}

const Ctx = createContext<ToastApi>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((m: string) => {
    setMessage(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3500);
  }, []);
  const api = useMemo(() => ({ toast }), [toast]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] flex justify-center px-4"
      >
        {message ? (
          <div className="rounded-md bg-ink px-4 py-2 text-sm text-surface shadow-lg">
            {message}
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(Ctx);
}
