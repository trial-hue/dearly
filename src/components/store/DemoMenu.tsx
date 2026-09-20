'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ThemeToggle } from '@/components/shell/ThemeToggle';
import { useToast } from '@/components/shell/Toast';
import { api } from '@/lib/fetcher';

/** The only place on customer screens that reveals the pilot: links to the consoles, reset, theme, AI status. */
export function DemoMenu({ aiMode, aiLabel }: { aiMode: 'ai' | 'rules'; aiLabel: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer select-none text-ink-2 hover:text-ink">Demo</summary>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[12px] bg-surface-2 p-3">
        <Link href="/business" className="btn btn-sm">
          Dearly for Business
        </Link>
        <Link href="/hq/operations" className="btn btn-sm">
          Dearly HQ
        </Link>
        <button
          type="button"
          className="btn btn-sm"
          data-testid="demo-reset"
          disabled={busy}
          onClick={async () => {
            if (
              !window.confirm(
                'Reset the demo? Every order, proposal and edit goes back to the seeded state.',
              )
            )
              return;
            setBusy(true);
            try {
              await api('/api/demo/reset', { json: {} });
              try {
                localStorage.removeItem('dearly-basket');
              } catch {
                // ignore
              }
              toast('Demo reset');
              router.refresh();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Resetting…' : 'Reset demo'}
        </button>
        <ThemeToggle />
        <span
          className={`pill ${aiMode === 'ai' ? 'text-success' : 'text-warning'}`}
          data-testid="ai-status"
          title={
            aiMode === 'ai'
              ? 'AI jobs run through the configured provider'
              : 'No API key configured: every AI job runs on built-in rules'
          }
        >
          <span className={`pill-dot ${aiMode === 'ai' ? 'bg-success' : 'bg-warning'}`} />
          {aiLabel}
        </span>
      </div>
    </details>
  );
}
