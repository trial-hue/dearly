'use client';

import { useState } from 'react';

import { Badge, ErrorNote } from '@/components/ui';
import { STAGE_LABELS } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { fmtDate } from '@/lib/format';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  applied?: string | null;
  by?: 'ai' | 'rule';
}

interface OrderSummary {
  id: string;
  recipientName: string;
  stage: string;
  promisedDate: string;
  late: boolean;
}

export function HelpChat({ orders }: { orders: OrderSummary[] }) {
  const { run, busy, error } = useAction();
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: 'assistant',
      content:
        'Hello, I am Dearly’s help agent, an AI. Ask about any card: where it is, if it is late or damaged, or if you need it faster.',
    },
  ]);
  const [text, setText] = useState('');

  const send = () => {
    const message = text.trim();
    if (!message) return;
    const history = turns
      .filter((t) => t.role === 'user' || t.role === 'assistant')
      .map((t) => ({ role: t.role, content: t.content }));
    setTurns((t) => [...t, { role: 'user', content: message }]);
    setText('');
    void run('send', async () => {
      const r = await api<{
        reply: string;
        action: string;
        orderId: string | null;
        by: 'ai' | 'rule';
        applied: string | null;
      }>('/api/agent', { json: { message, turns: history.slice(-6) } });
      setTurns((t) => [
        ...t,
        { role: 'assistant', content: r.reply, action: r.action, applied: r.applied, by: r.by },
      ]);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <section className="card flex min-h-[420px] flex-col" aria-label="Chat">
        <ol className="flex flex-1 flex-col gap-2 overflow-y-auto" data-testid="chat-log">
          {turns.map((t, i) => (
            <li
              key={i}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${t.role === 'user' ? 'self-end bg-ink text-surface' : 'self-start bg-surface2'}`}
            >
              <p>{t.content}</p>
              {t.role === 'assistant' && t.action && t.action !== 'none' ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge kind="ai">Action: {t.action.replace('_', ' ')}</Badge>
                  {t.applied ? <Badge>{t.applied}</Badge> : null}
                </div>
              ) : null}
              {t.role === 'assistant' && t.by ? (
                <div className="mt-1">
                  {t.by === 'ai' ? (
                    <Badge kind="ai">Answered by AI</Badge>
                  ) : (
                    <Badge>Built-in rules</Badge>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            id="chat-input"
            className="input"
            placeholder="e.g. my card for Dan hasn't arrived"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Your message"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy !== null || !text.trim()}
            data-testid="chat-send"
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
        </form>
        <ErrorNote message={error} />
      </section>
      <aside className="card text-sm">
        <h2 className="font-bold">Your recent orders</h2>
        <ul className="mt-2 space-y-1">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap gap-x-2">
              <span className="font-medium">{o.recipientName}</span>
              <span className="muted">
                {STAGE_LABELS[o.stage] ?? o.stage}, promised {fmtDate(o.promisedDate)}
                {o.late ? ', late' : ''}
              </span>
            </li>
          ))}
        </ul>
        <p className="muted mt-3 text-xs">
          Every action the agent takes is written to the decision log on Operations. Refunds need a
          late or damaged order.
        </p>
      </aside>
    </div>
  );
}
