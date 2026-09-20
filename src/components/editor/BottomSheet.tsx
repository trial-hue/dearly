'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

/** On phones the tools sit in a sheet at the bottom of the screen that expands over the card. */
export function BottomSheet({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section
      className={`fixed inset-x-0 bottom-[72px] z-20 rounded-t-[16px] bg-surface shadow-[0_-8px_24px_rgba(20,33,61,0.12)] transition-[max-height] duration-150 ease-out md:hidden ${expanded ? 'max-h-[70vh]' : 'max-h-[44vh]'}`}
      aria-label={title}
    >
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <span className="sr-only">{expanded ? 'Collapse tools' : 'Expand tools'}</span>
        {expanded ? (
          <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <ChevronUp size={18} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
      <div
        className={`overflow-y-auto px-4 pb-4 ${expanded ? 'max-h-[calc(70vh-40px)]' : 'max-h-[calc(44vh-40px)]'}`}
      >
        {children}
      </div>
    </section>
  );
}
