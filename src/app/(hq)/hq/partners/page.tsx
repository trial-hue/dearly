import type { Metadata } from 'next';

import { FloristWorkbench } from '@/components/florists/FloristWorkbench';
import { PageHeader } from '@/components/shell/PageHeader';
import { Badge, Empty, Simulated } from '@/components/ui';
import { sampleFloristOrder } from '@/domain';
import { fmtDate, formatPence } from '@/lib/format';
import { now } from '@/server/clock';
import { listReferrals } from '@/server/services/partners';

export const metadata: Metadata = { title: 'Partners' };
export const dynamic = 'force-dynamic';

export default async function FloristsPage() {
  const referrals = await listReferrals();
  const owed = referrals.reduce((s, r) => s + r.ledger.referralFeePence, 0);
  const expected = referrals.reduce((s, r) => s + r.ledger.expectedCommissionPence, 0);
  return (
    <>
      <PageHeader
        title="Florist partners"
        lede="A florist's order tells us who matters to their customer. Dearly reads it, sets a reminder for next year with a free first card, and pays the florist a referral fee. Next year the flowers are ordered through Dearly and the florist earns commission."
      >
        <Simulated what="Bloom and Co" />
      </PageHeader>
      <FloristWorkbench sample={sampleFloristOrder(now())} />
      <h2 className="section-title">Ledger</h2>
      {referrals.length === 0 ? (
        <Empty>No referrals yet. Read the sample order and claim the free first card.</Empty>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap gap-2 text-sm">
            <Badge>Owed to florists {formatPence(owed)}</Badge>
            <Badge kind="ai">Commission expected next year {formatPence(expected)}</Badge>
          </div>
          <div className="tbl-wrap">
            <table className="table" data-testid="ledger">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Florist</th>
                  <th>Customer</th>
                  <th>Reminder</th>
                  <th>Next date</th>
                  <th className="num">Fee owed</th>
                  <th className="num">Commission next year</th>
                  <th>Read by</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.createdAt)}</td>
                    <td>{r.partner}</td>
                    <td>{r.ledger.customer}</td>
                    <td>
                      {r.ledger.recipient} ({r.ledger.occasion.replace('_', ' ')}), free first card
                    </td>
                    <td>{r.ledger.nextDate ?? 'next year'}</td>
                    <td className="num">{formatPence(r.ledger.referralFeePence)}</td>
                    <td className="num">{formatPence(r.ledger.expectedCommissionPence)}</td>
                    <td>
                      {r.ledger.readBy === 'ai' ? (
                        <Badge kind="ai">AI</Badge>
                      ) : (
                        <Badge>rules</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
