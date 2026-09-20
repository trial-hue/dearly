import Link from 'next/link';

import { ToastProvider } from '@/components/shell/Toast';
import { Logo } from '@/components/store/Logo';
import { aiStatus } from '@/server/ai/gateway';

import { HqNav } from './HqNav';

/** Layout C: Dearly HQ. Dashboard style; never linked from the storefront except the Demo menu. */
export function HqShell({ children }: { children: React.ReactNode }) {
  const status = aiStatus();
  return (
    <ToastProvider>
      <div className="min-h-full">
        <header className="border-b border-line bg-surface">
          <div className="container-x flex flex-wrap items-center gap-4 py-3">
            <Logo href="/hq/operations" suffix="HQ" />
            <HqNav />
            <span
              className={`pill ml-auto ${status.mode === 'ai' ? 'text-success' : 'text-warning'}`}
              data-testid="ai-status"
            >
              <span className={`pill-dot ${status.mode === 'ai' ? 'bg-success' : 'bg-warning'}`} />
              {status.label}
            </span>
            <Link href="/" className="text-sm text-ink-2 hover:text-ink hover:underline">
              Storefront
            </Link>
          </div>
        </header>
        <main className="container-x py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
