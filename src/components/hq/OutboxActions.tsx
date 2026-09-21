'use client';

import { useRouter } from 'next/navigation';

import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';

/** "Send due notifications now" and "Jump forward 7 days": both call the simulated sender. */
export function OutboxActions() {
  const router = useRouter();
  const { toast } = useToast();
  const { run, busy, error } = useAction();
  const send = (daysAhead: number) =>
    run(daysAhead ? 'jump' : 'send', async () => {
      const r = await api<{ sent: number }>('/api/hq/outbox', {
        json: { action: 'send_due', daysAhead },
      });
      toast(`Sent ${r.sent} message${r.sent === 1 ? '' : 's'} (simulated)`);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-sm"
        disabled={busy !== null}
        data-testid="outbox-send-due"
        onClick={() => void send(0)}
      >
        {busy === 'send' ? 'Sending…' : 'Send due notifications now'}
      </button>
      <button
        type="button"
        className="btn btn-sm"
        disabled={busy !== null}
        data-testid="outbox-jump"
        onClick={() => void send(7)}
      >
        {busy === 'jump' ? 'Sending…' : 'Jump forward 7 days'}
      </button>
      <ErrorNote message={error} />
    </div>
  );
}
