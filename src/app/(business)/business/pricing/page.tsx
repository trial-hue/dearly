import type { Metadata } from 'next';

import { Calculator } from '@/components/business/Calculator';
import { BUSINESS } from '@/domain';
import { formatPence } from '@/lib/format';

export const metadata: Metadata = { title: 'Business pricing' };

export default function BusinessPricingPage() {
  return (
    <div>
      <h1 className="t-h1">Pricing</h1>
      <p className="mb-6 mt-1 text-ink-2">Prices are per card, ex VAT, delivery included.</p>
      <div className="mb-8 grid gap-3 sm:grid-cols-3" data-testid="business-prices">
        {[
          [
            'Posted to a home',
            formatPence(BUSINESS.posted * 100),
            `${formatPence(BUSINESS.tier250 * 100)} from 250 cards a year, ${formatPence(BUSINESS.tier2000 * 100)} from 2,000`,
          ],
          [
            'Dropped at the office',
            formatPence(BUSINESS.officeDrop * 100),
            'Batched by date, one delivery',
          ],
          [
            'Automate plan',
            `${formatPence(BUSINESS.automateMonthly * 100)} a month`,
            `${BUSINESS.freeCards} cards included; nothing to remember`,
          ],
        ].map(([t, price, note]) => (
          <div key={t} className="rounded-[12px] bg-surface p-4">
            <p className="text-sm text-ink-2">{t}</p>
            <p className="t-h2 mt-1">{price}</p>
            <p className="text-xs text-ink-2">{note}</p>
          </div>
        ))}
      </div>
      <h2 className="t-h3 mb-3">A year for your team</h2>
      <Calculator />
    </div>
  );
}
