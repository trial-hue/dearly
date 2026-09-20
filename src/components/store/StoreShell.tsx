import { ToastProvider } from '@/components/shell/Toast';
import { aiStatus } from '@/server/ai/gateway';

import { BottomTabBar } from './BottomTabBar';
import { storeCategories } from './categories';
import { CategoryNav } from './CategoryNav';
import { FloatingHelp } from './FloatingHelp';
import { Footer } from './Footer';
import { Header } from './Header';
import { PromoStrip } from './PromoStrip';

/** Layout A: the storefront. */
export function StoreShell({ children }: { children: React.ReactNode }) {
  const status = aiStatus();
  return (
    <ToastProvider>
      <PromoStrip />
      <Header />
      <CategoryNav categories={storeCategories()} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer aiMode={status.mode} aiLabel={status.label} />
      <FloatingHelp />
      <BottomTabBar />
    </ToastProvider>
  );
}
