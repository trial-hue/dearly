import { aiStatus } from '@/server/ai/gateway';

import { Nav } from './Nav';
import { ToastProvider } from './Toast';

export function AppShell({ children }: { children: React.ReactNode }) {
  const status = aiStatus();
  return (
    <ToastProvider>
      <div className="grid min-h-full grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)]">
        <Nav aiMode={status.mode} aiLabel={status.label} />
        <main className="min-w-0 px-4 pb-16 pt-4 md:px-8 md:pt-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
