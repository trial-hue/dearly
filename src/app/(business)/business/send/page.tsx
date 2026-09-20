import type { Metadata } from 'next';

import { BusinessWorkbench } from '@/components/business/BusinessWorkbench';
import { fmtDate, formatPence } from '@/lib/format';
import { getOrganisation } from '@/server/services/business';

export const metadata: Metadata = { title: 'Send cards' };
export const dynamic = 'force-dynamic';

export default async function BusinessSendPage() {
  const org = await getOrganisation();
  return (
    <div>
      <h1 className="t-h1">Send cards</h1>
      <p className="mb-6 mt-1 text-ink-2">
        {org.name}: paste the staff list, check what we read, choose how they travel, schedule
        everything at once.
      </p>
      <BusinessWorkbench staffText={org.staffText} />
      <h2 className="section-title">Scheduled batches</h2>
      {org.batches.length === 0 ? (
        <p className="rounded-[12px] bg-surface p-4 text-sm text-ink-2">
          No batches yet. Clean the list and choose Schedule all.
        </p>
      ) : (
        <div className="tbl-wrap rounded-[12px] bg-surface p-2">
          <table className="table" data-testid="batches">
            <thead>
              <tr>
                <th>Created</th>
                <th>First send</th>
                <th>Delivery</th>
                <th>Finish</th>
                <th className="num">Cards</th>
                <th className="num">Price ex VAT</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {org.batches.map((b) => (
                <tr key={b.id}>
                  <td>{fmtDate(b.createdAt)}</td>
                  <td>{fmtDate(b.sendDate)}</td>
                  <td>{b.deliveryOption === 'posted' ? 'Home post' : 'Office drop'}</td>
                  <td>{b.finish}</td>
                  <td className="num">
                    {b.cardCount}
                    {b.giantCount ? ` (${b.giantCount} Giant)` : ''}
                  </td>
                  <td className="num">{formatPence(b.pricePence)}</td>
                  <td>
                    <span className={`label ${b.status === 'sent' ? 'label-success' : ''}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
