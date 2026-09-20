import Link from 'next/link';

import { ToastProvider } from '@/components/shell/Toast';
import { Logo } from '@/components/store/Logo';

import { BusinessNav } from './BusinessNav';

/** Layout B: Dearly for Business. Calmer and denser than the storefront, with its own header. */
export function BusinessShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-full bg-surface-2">
        <header className="border-b border-line bg-surface">
          <div className="container-x flex flex-wrap items-center gap-4 py-3">
            <Logo href="/business" suffix="for Business" />
            <BusinessNav />
            <Link href="/" className="ml-auto text-sm text-ink-2 hover:text-ink hover:underline">
              Back to Dearly
            </Link>
          </div>
        </header>
        <main className="container-x py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
