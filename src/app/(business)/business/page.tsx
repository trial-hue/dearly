import type { Metadata } from 'next';

import { BusinessWorkbench } from '@/components/business/BusinessWorkbench';
import { Calculator } from '@/components/business/Calculator';
import { PageHeader } from '@/components/shell/PageHeader';
import { Badge, Empty } from '@/components/ui';
import { fmtDate, formatPence } from '@/lib/format';
import { getOrganisation } from '@/server/services/business';

export const metadata: Metadata = { title: 'Business sends' };
export const dynamic = 'force-dynamic';

export default async function BusinessPage() {
  const org = await getOrganisation();
  return (
    <>
      <PageHeader
        title="Business sends"
        lede={`${org.name}: paste the staff list, let Dearly clean it, and every birthday, work anniversary and leaving card goes out on time at a business price.`}
      />
      <BusinessWorkbench staffText={org.staffText} />
      <h2 className="section-title">Scheduled batches</h2>
      {org.batches.length === 0 ? (
        <Empty>No batches yet. Clean the list and choose &ldquo;Schedule all&rdquo;.</Empty>
      ) : (
        <div className="tbl-wrap">
          <table className="table" data-testid="batches">
            <thead>
              <tr>
                <th>Created</th>
                <th>First send</th>
                <th>Delivery</th>
                <th>Finish</th>
                <th className="num">Cards</th>
                <th className="num">Price ex VAT</th>
                <th className="num">Contribution</th>
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
                  <td className="num">{formatPence(b.contributionPence)}</td>
                  <td>
                    <Badge kind={b.status === 'sent' ? 'ai' : 'plain'}>{b.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 className="section-title">A year against Moonpig</h2>
      <Calculator />
    </>
  );
}
