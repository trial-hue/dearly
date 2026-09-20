'use client';

import { Field } from '@/components/ui';
import type { CardSpec } from '@/domain';

export function MessageStep({
  message,
  font,
  messageBy,
  onMessage,
  onCommit,
  onFont,
  onRewrite,
  busy,
}: {
  message: string;
  font: CardSpec['font'];
  messageBy: string;
  onMessage: (m: string) => void;
  onCommit: () => void;
  onFont: (f: CardSpec['font']) => void;
  onRewrite: () => void;
  busy: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Your message</h3>
        <button type="button" className="btn btn-sm" onClick={onRewrite} disabled={busy !== null}>
          {busy === 'rewrite' ? 'Rewriting…' : 'Write it for me'}
        </button>
      </div>
      <textarea
        id="editor-message"
        data-testid="message-input"
        className="input min-h-[120px] font-hand text-xl"
        value={message}
        onChange={(e) => onMessage(e.target.value)}
        onBlur={onCommit}
        maxLength={400}
        aria-label="Card message"
      />
      {messageBy === 'ai' ? (
        <p className="text-xs font-semibold text-success">
          Drafted for you. Change anything you like.
        </p>
      ) : null}
      <Field label="Font" htmlFor="editor-font">
        <select
          id="editor-font"
          className="input"
          value={font}
          onChange={(e) => onFont(e.target.value as CardSpec['font'])}
        >
          <option value="hand">Handwritten</option>
          <option value="print">Printed</option>
          <option value="serif">Serif</option>
          <option value="mono">Typewriter</option>
        </select>
      </Field>
    </div>
  );
}
