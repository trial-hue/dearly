'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { CardFront } from '@/components/card/CardFront';
import { DesignPicker } from '@/components/card/DesignPicker';
import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote, Field } from '@/components/ui';
import {
  DIGITAL,
  FINISHES,
  GIFTS,
  MODES,
  PRICE,
  SIZES,
  allowedModes,
  arrivalDate,
  quote,
  type CardSpec,
  type Finish,
  type Mode,
  type Size,
} from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { fmtDate, formatPence } from '@/lib/format';
import type { Serialized } from '@/lib/serialize';
import type { ProposalView } from '@/server/services/proposals';

import { MediaTools } from './MediaTools';

type ProposalDTO = Serialized<ProposalView>;

export function CardEditor({ proposal: initial }: { proposal: ProposalDTO }) {
  const router = useRouter();
  const { toast } = useToast();
  const { run, busy, error } = useAction();
  const [p, setP] = useState<ProposalDTO>(initial);
  const [card, setCard] = useState<CardSpec>(initial.card);
  const [message, setMessage] = useState(initial.card.message);

  const first = p.person.name.split(' ')[0] ?? p.person.name;
  const localQuote = safeQuote(card);
  const due = new Date(p.dueDate);
  const arrival = arrivalDate(card.mode, card.size, due, new Date());
  const modes = allowedModes(card.size);

  const close = () => router.push('/today');

  const patch = useCallback(
    async (changes: Partial<CardSpec>) => {
      const next = { ...card, ...changes };
      setCard(next);
      const view = await run(
        'edit',
        () =>
          api<ProposalDTO>(`/api/proposals/${encodeURIComponent(p.key)}`, {
            method: 'PATCH',
            json: { action: 'edit', patch: changes },
          }),
        { refresh: false },
      );
      if (view) {
        setP(view);
        setCard(view.card);
        setMessage(view.card.message);
      }
    },
    [card, p.key, run],
  );

  const commitMessage = () => {
    if (message !== card.message) void patch({ message });
  };

  const rewrite = () =>
    run('rewrite', async () => {
      const r = await api<{ view: ProposalDTO; by: 'ai' | 'rule' }>('/api/ai/rewrite_message', {
        json: { key: p.key },
      });
      setP(r.view);
      setCard(r.view.card);
      setMessage(r.view.card.message);
      toast(r.by === 'ai' ? 'Rewritten by AI' : 'Rewritten from the built-in templates');
    });

  const approve = () =>
    run('approve', async () => {
      await api(`/api/proposals/${encodeURIComponent(p.key)}`, {
        method: 'PATCH',
        json: { action: 'approve' },
      });
      toast(`Approved ${first}'s card`);
      router.push('/orders');
    });

  const confirmAddress = () =>
    run('confirm', async () => {
      const view = await api<ProposalDTO>(`/api/proposals/${encodeURIComponent(p.key)}`, {
        method: 'PATCH',
        json: { action: 'confirm_address' },
      });
      setP(view);
      toast('Address confirmed');
    });

  const skip = () =>
    run('skip', async () => {
      await api(`/api/proposals/${encodeURIComponent(p.key)}`, {
        method: 'PATCH',
        json: { action: 'skip' },
      });
      toast(`Skipped ${first}'s card this year`);
      router.push('/today');
    });

  const ecardOnly = card.mode === 'ecard';
  const isGiant = card.size === 'giant';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
      className="fixed inset-0 z-30 flex justify-end bg-ink/40"
      onClick={close}
    >
      <div
        className="h-full w-full max-w-3xl overflow-y-auto bg-bg p-4 shadow-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="card-editor"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-1">
            <h2 id="editor-title" className="text-xl font-bold">
              {p.title} for {p.person.name}
            </h2>
            <p className="muted text-sm">
              {fmtDate(p.dueDate)} · {p.person.relationship}
              {p.age != null ? ` · turning ${p.age}` : ''}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={close}>
            Close
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="md:sticky md:top-0 md:self-start">
            <CardFront card={card} title={p.title} name={first} age={p.age} />
            <div
              className="paper mt-3 p-3 font-hand text-[19px] leading-snug"
              aria-label="Inside of the card"
            >
              {message || <span className="opacity-50">Your message</span>}
              {card.handwriting ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded handwriting from the app's own storage
                <img
                  src={card.handwriting.url}
                  alt="Handwriting"
                  className={`mt-2 ${card.handwriting.signatureOnly ? 'ml-auto w-1/2' : 'w-full'}`}
                />
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.messageBy === 'ai' ? <Badge kind="ai">Drafted by AI</Badge> : null}
              {p.madeBy === 'ai' ? <Badge kind="ai">Options chosen by AI</Badge> : null}
              {p.aiReason ? <span className="muted text-xs">{p.aiReason}</span> : null}
            </div>
          </aside>

          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-bold">Design</h3>
              <DesignPicker
                value={card.design}
                onChange={(design) => void patch({ design, customFront: null })}
                title={p.title}
                name={first}
                age={p.age}
              />
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold">Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SIZES) as Size[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn btn-choice"
                    aria-pressed={card.size === s}
                    onClick={() => void patch({ size: s })}
                    disabled={ecardOnly}
                  >
                    <span className="font-bold">{SIZES[s].label}</span>
                    <span className="muted text-xs">{SIZES[s].note}</span>
                  </button>
                ))}
              </div>
              {p.card.offerGiant && !isGiant ? (
                <button
                  type="button"
                  className="btn btn-sm mt-2"
                  onClick={() => void patch({ size: 'giant', finish: 'signature' })}
                >
                  Make it a Giant group card
                </button>
              ) : null}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold">Finish</h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FINISHES) as Finish[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="btn btn-choice"
                    aria-pressed={card.finish === f}
                    onClick={() => void patch({ finish: f })}
                    disabled={ecardOnly}
                  >
                    <span className="font-bold">
                      {FINISHES[f].label}{' '}
                      <span className="tabular-nums">
                        {formatPence(Math.round(PRICE[card.size][f] * 100))}
                      </span>
                    </span>
                    <span className="muted text-xs">{FINISHES[f].note}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-bold">Message</h3>
                <button
                  type="button"
                  className="btn btn-sm ml-auto"
                  onClick={() => void rewrite()}
                  disabled={busy !== null}
                >
                  {busy === 'rewrite' ? 'Rewriting…' : 'Rewrite'}
                </button>
              </div>
              <textarea
                id="editor-message"
                className="input min-h-[96px] font-hand text-lg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={commitMessage}
                maxLength={400}
                aria-label="Card message"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Field label="Font" htmlFor="editor-font">
                  <select
                    id="editor-font"
                    className="input"
                    value={card.font}
                    onChange={(e) => void patch({ font: e.target.value as CardSpec['font'] })}
                  >
                    <option value="hand">Handwritten</option>
                    <option value="print">Printed</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Typewriter</option>
                  </select>
                </Field>
              </div>
            </section>

            <MediaTools
              proposalKey={p.key}
              card={card}
              size={card.size}
              onCard={(view) => {
                setP(view);
                setCard(view.card);
              }}
            />

            <section>
              <h3 className="mb-2 text-sm font-bold">Add-ons</h3>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={card.digital}
                    disabled={ecardOnly}
                    onChange={(e) => void patch({ digital: e.target.checked })}
                  />
                  Digital copy by link, {formatPence(Math.round(DIGITAL.paired * 100))}
                </label>
                <Field label="Gift" htmlFor="editor-gift">
                  <select
                    id="editor-gift"
                    className="input"
                    value={card.gift}
                    disabled={ecardOnly}
                    onChange={(e) => void patch({ gift: e.target.value as CardSpec['gift'] })}
                  >
                    {GIFTS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                        {g.price ? ` · ${formatPence(g.price * 100)}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ecardOnly}
                    onChange={(e) =>
                      void patch({
                        mode: e.target.checked ? 'ecard' : (modes[0] ?? 'advance'),
                        modeOverridden: false,
                      })
                    }
                  />
                  eCard only, {formatPence(Math.round(DIGITAL.standalone * 100))}. Sent by link
                  today, no printed card.
                </label>
              </div>
            </section>

            {!ecardOnly ? (
              <section>
                <h3 className="mb-2 text-sm font-bold">Delivery</h3>
                <div
                  role="radiogroup"
                  aria-label="Delivery mode"
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {modes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={card.mode === m}
                      className="btn btn-choice"
                      onClick={() => void patch({ mode: m })}
                      disabled={isGiant && m !== 'tracked'}
                    >
                      <span className="font-bold">
                        {MODES[m].label}{' '}
                        <span className="tabular-nums">
                          {formatPence(
                            Math.round(
                              ((MODES[m].price as Record<string, number>)[card.size] ?? 0) * 100,
                            ),
                          )}
                        </span>
                      </span>
                      <span className="muted text-xs">{MODES[m].desc}</span>
                    </button>
                  ))}
                </div>
                <p className="muted mt-2 text-xs">
                  {card.modeOverridden
                    ? 'You chose this mode.'
                    : 'Chosen by the delivery rule for the days left.'}{' '}
                  Arrives {fmtDate(arrival)}.{isGiant ? ' Giant cards are tracked only.' : ''}
                  {p.card.offerEcard
                    ? ' An on-the-day eCard is included so nothing is missed.'
                    : ''}
                </p>
              </section>
            ) : null}

            <section className="card" data-testid="price-summary">
              <h3 className="mb-2 text-sm font-bold">Price</h3>
              <dl className="space-y-1 text-sm">
                {localQuote.lines.map((l) => (
                  <div key={l.label} className="flex justify-between gap-3">
                    <dt>{l.label}</dt>
                    <dd className="tabular-nums">{formatPence(l.pence)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 border-t border-line pt-1 font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums" data-testid="price-total">
                    {formatPence(localQuote.totalPence)}
                  </dd>
                </div>
              </dl>
              {localQuote.moonpigPence != null ? (
                <p className="mt-2 text-sm" data-testid="moonpig-compare">
                  Moonpig: {formatPence(localQuote.moonpigPence)} for the same Regular card
                  {card.mode === 'tracked' ? ' tracked' : ' first class'}.
                  {localQuote.savingPence && localQuote.savingPence > 0 ? (
                    <strong> You save {formatPence(localQuote.savingPence)}.</strong>
                  ) : null}
                </p>
              ) : localQuote.moonpigNote ? (
                <p className="mt-2 text-sm">{localQuote.moonpigNote}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1">
                {localQuote.guarantee ? (
                  <Badge kind="ai">Delivery guarantee: refund and recovery if it is late</Badge>
                ) : null}
                <Badge>
                  Contribution {formatPence(localQuote.contributionPence)} on{' '}
                  {formatPence(localQuote.exVatPence)} ex VAT
                </Badge>
              </div>
            </section>

            <section className="card">
              <h3 className="mb-1 text-sm font-bold">Address</h3>
              <p className="text-sm">
                {p.person.postcode ?? 'No postcode on file'}
                {p.person.stale ? (
                  <span className="ml-2 text-amber">Last checked over a year ago</span>
                ) : (
                  <span className="muted ml-2">Checked within the year</span>
                )}
              </p>
              {p.person.stale && !ecardOnly ? (
                <button
                  type="button"
                  className="btn btn-sm mt-2"
                  onClick={() => void confirmAddress()}
                  disabled={busy !== null}
                >
                  Address is still right
                </button>
              ) : null}
            </section>

            <ErrorNote message={error} />
            <div className="flex flex-wrap gap-2 pb-6">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void approve()}
                disabled={busy !== null || !p.approvable}
                data-testid="approve"
              >
                {busy === 'approve'
                  ? 'Paying…'
                  : `Approve and pay ${formatPence(localQuote.totalPence)}`}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void skip()}
                disabled={busy !== null}
              >
                Skip this year
              </button>
              <button type="button" className="btn btn-ghost ml-auto" onClick={close}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function safeQuote(card: CardSpec) {
  try {
    return quote(card);
  } catch {
    return quote({ ...card, mode: 'tracked' });
  }
}

export type { Mode };
