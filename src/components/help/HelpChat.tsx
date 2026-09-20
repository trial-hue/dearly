'use client';

import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

import { ErrorNote } from '@/components/ui';
import { api, useAction } from '@/lib/fetcher';

import { ChatBubble } from './ChatBubble';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  applied?: string | null;
}

const QUICK = [
  'Where is my card?',
  "My card hasn't arrived",
  'It arrived damaged',
  'Can it come sooner?',
];

/** A centred chat with quick replies. What the agent did shows as a small chip. */
export function HelpChat({ recentNames }: { recentNames: string[] }) {
  const { run, busy, error } = useAction();
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: 'assistant',
      content: `Hi, I'm Dearly's help assistant. Ask about any card: where it is, if it's late or damaged, or if you need it faster.${recentNames.length ? ` Your recent cards were for ${recentNames.join(', ')}.` : ''}`,
    },
  ]);
  const [text, setText] = useState('');

  const send = (message: string) => {
    const m = message.trim();
    if (!m) return;
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((t) => [...t, { role: 'user', content: m }]);
    setText('');
    void run('send', async () => {
      const r = await api<{ reply: string; action: string; applied: string | null }>('/api/agent', {
        json: { message: m, turns: history.slice(-6) },
      });
      setTurns((t) => [
        ...t,
        {
          role: 'assistant',
          content: r.reply,
          applied: r.action !== 'none' ? (r.applied ?? r.action.replace('_', ' ')) : null,
        },
      ]);
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="flex min-h-[380px] flex-col gap-2" data-testid="chat-log">
        {turns.map((t, i) => (
          <ChatBubble
            key={i}
            role={t.role}
            footer={
              t.applied ? <span className="label label-success">Done: {t.applied}</span> : undefined
            }
          >
            {t.content}
          </ChatBubble>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            className="chip"
            disabled={busy !== null}
            onClick={() => send(q)}
          >
            {q}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input
          id="chat-input"
          data-testid="chat-input"
          className="input input-pill"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Your message"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy !== null || !text.trim()}
          data-testid="chat-send"
          aria-label="Send"
        >
          <SendHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
      <ErrorNote message={error} />
      <p className="mt-3 text-center text-xs text-ink-2">
        You are talking to an assistant. A person steps in whenever it matters, and can be reached
        by phone.
      </p>
    </div>
  );
}
