import type { Metadata } from 'next';

import { OutboxActions } from '@/components/hq/OutboxActions';
import { PageHeader } from '@/components/shell/PageHeader';
import { Badge, Empty } from '@/components/ui';
import { fmtDate, fmtTime } from '@/lib/format';
import { listOutbox } from '@/server/services/notifications';

export const metadata: Metadata = { title: 'Outbox' };
export const dynamic = 'force-dynamic';

export default async function OutboxPage() {
  const rows = await listOutbox();
  return (
    <div className="container-x section">
      <PageHeader
        title="Outbox"
        lede="Email sending is simulated in the pilot. Messages are held in this outbox."
      >
        <OutboxActions />
      </PageHeader>
      {rows.length === 0 ? (
        <Empty>
          Nothing scheduled yet. Open Reminders to create proposals and their reminders.
        </Empty>
      ) : (
        <div className="tbl-wrap">
          <table className="table" data-testid="outbox">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Step</th>
                <th>Channel</th>
                <th>Subject</th>
                <th>Scheduled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-testid={`outbox-${r.id}`}>
                  <td>{r.recipient}</td>
                  <td>{r.step}</td>
                  <td>{r.channel}</td>
                  <td className="whitespace-normal">
                    {r.subject}
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-ink-2">Preview</summary>
                      <div
                        className="prose prose-sm mt-2 max-w-none rounded-md bg-surface-2 p-3 text-sm"
                        dangerouslySetInnerHTML={{ __html: r.html }}
                      />
                    </details>
                  </td>
                  <td>
                    {fmtDate(r.scheduledFor)} {fmtTime(r.scheduledFor)}
                  </td>
                  <td>
                    <Badge kind={r.status === 'sent' ? 'ai' : undefined}>{r.status}</Badge>
                    {r.sentAt ? (
                      <span className="muted ml-1 text-xs">{fmtDate(r.sentAt)}</span>
                    ) : null}
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
