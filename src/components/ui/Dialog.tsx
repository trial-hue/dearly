'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

/** A native dialog: focus is trapped by the browser, Escape closes, the backdrop closes. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  testId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`m-auto w-[min(100vw-32px,${wide ? '880px' : '520px'})] rounded-[16px] bg-surface p-0 text-ink shadow-[var(--shadow-tile-hover)] backdrop:bg-ink/50`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      data-testid={testId}
    >
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <h2 id="dialog-title" className="t-h3">
          {title}
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm ml-auto"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5">{open ? children : null}</div>
    </dialog>
  );
}
