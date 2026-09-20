import type { Metadata } from 'next';

import { BasketView } from '@/components/basket/BasketView';

export const metadata: Metadata = { title: 'Basket' };
export const dynamic = 'force-dynamic';

export default function BasketPage() {
  return (
    <div className="container-x section">
      <BasketView />
    </div>
  );
}
