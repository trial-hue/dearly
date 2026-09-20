'use client';

import { useMemo, useState } from 'react';

import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote, Field } from '@/components/ui';
import {
  BUSINESS,
  FINISHES,
  priceBatch,
  schedulable,
  sendDateFor,
  staffRowsSummary,
  type DeliveryOption,
  type Finish,
  type StaffRow,
} from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { fmtDate, formatPence } from '@/lib/format';

export function BusinessWorkbench({ staffText }: { staffText: string }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [text, setText] = useState(staffText);
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [by, setBy] = useState<'ai' | 'rule'>('rule');
  const [option, setOption] = useState<DeliveryOption>('posted');
  const [finish, setFinish] = useState<Finish>('signature');
  const [template, setTemplate] = useState(
    'Happy birthday, {first_name}. Have a brilliant day, from all of us at the studio.',
  );
  const [automate, setAutomate] = useState(false);
  const [giant, setGiant] = useState(true);
  const today = useMemo(() => new Date(), []);

  const ready = rows?.filter((r) => schedulable(r, option) && sendDateFor(r, option, today)) ?? [];
  const summary = rows ? staffRowsSummary(rows, option) : null;
  const giantCards = giant ? ready.filter((r) => r.occasion === 'leaving').length : 0;
  const pricing = ready.length
    ? priceBatch(ready.length, { option, finish, annualCards: ready.length, automate, giantCards })
    : null;

  const clean = (mode: 'rules' | 'ai') =>
    run(
      mode,
      async () => {
        const r = await api<{ rows: StaffRow[]; by: 'ai' | 'rule' }>(
          mode === 'ai' ? '/api/ai/clean_staff_list' : '/api/business/clean',
          { json: { text } },
        );
        setRows(r.rows);
        setBy(r.by);
      },
      { refresh: false },
    );

  const schedule = () =>
    run('schedule', async () => {
      const r = await api<{ cards: number; pricePence: number }>('/api/business/schedule', {
        json: { option, finish, automate, giantForLeavers: giant, rows: ready },
      });
      toast(
        `Scheduled ${r.cards} cards for ${formatPence(r.pricePence)} ex VAT. The batch is on Operations.`,
      );
      setRows(null);
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="card">
        <label htmlFor="staff-text" className="text-xs font-medium text-ink-2">
          Staff list (name, date, occasion, postcode)
        </label>
        <textarea
          id="staff-text"
          className="input mt-1 min-h-[180px] font-mono text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy !== null}
            data-testid="clean-rules"
            onClick={() => void clean('rules')}
          >
            {busy === 'rules' ? 'Cleaning…' : 'Clean and schedule'}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy !== null}
            data-testid="clean-ai"
            onClick={() => void clean('ai')}
          >
            {busy === 'ai' ? 'Checking…' : 'Check it for me'}
          </button>
        </div>
        {rows && summary ? (
          <div className="mt-3" data-testid="staff-rows">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">
                {summary.scheduled} ready, {summary.flagged} flagged
              </span>
              {by === 'ai' ? <Badge kind="ai">Checked for you</Badge> : null}
            </div>
            <div className="tbl-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Occasion</th>
                    <th>Date</th>
                    <th>Postcode</th>
                    <th>Send date</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const send = sendDateFor(r, option, today);
                    const ok = schedulable(r, option) && send;
                    return (
                      <tr key={i} className={ok ? '' : 'opacity-70'}>
                        <td>{r.name || <span className="muted">?</span>}</td>
                        <td>{r.occasion.replace('_', ' ')}</td>
                        <td>{r.date ?? r.monthDay ?? '?'}</td>
                        <td>{r.postcode || <span className="muted">none</span>}</td>
                        <td>
                          {ok && send ? (
                            fmtDate(send)
                          ) : (
                            <span className="muted">not scheduled</span>
                          )}
                        </td>
                        <td>
                          {r.issue ? (
                            <Badge kind={ok ? 'flag' : 'danger'}>{r.issue}</Badge>
                          ) : (
                            <Badge kind="ai">ok</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <ErrorNote message={error} />
      </section>

      <aside className="card space-y-3">
        <h2 className="font-bold">Options</h2>
        <div role="radiogroup" aria-label="Delivery" className="grid grid-cols-2 gap-2">
          {(['posted', 'officeDrop'] as DeliveryOption[]).map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={option === o}
              data-testid={`option-${o}`}
              className="btn btn-choice"
              onClick={() => setOption(o)}
            >
              <span className="font-bold">{o === 'posted' ? 'Home post' : 'Office drop'}</span>
              <span className="muted text-xs">
                {formatPence(
                  Math.round((o === 'posted' ? BUSINESS.posted : BUSINESS.officeDrop) * 100),
                )}{' '}
                a card ex VAT{o === 'posted' ? ', tiers at 250 and 2,000 a year' : ''}
              </span>
            </button>
          ))}
        </div>
        <Field label="Finish" htmlFor="biz-finish">
          <select
            id="biz-finish"
            className="input"
            value={finish}
            onChange={(e) => setFinish(e.target.value as Finish)}
          >
            {(Object.keys(FINISHES) as Finish[]).map((f) => (
              <option key={f} value={f}>
                {FINISHES[f].label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Message template"
          htmlFor="biz-template"
          hint="{first_name} is filled in for each person."
        >
          <textarea
            id="biz-template"
            className="input min-h-[64px]"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={automate}
            onChange={(e) => setAutomate(e.target.checked)}
          />
          <span>
            Automate plan, {formatPence(BUSINESS.automateMonthly * 100)} a month with{' '}
            {BUSINESS.freeCards} cards included. Dearly watches the list and sends without asking.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={giant} onChange={(e) => setGiant(e.target.checked)} />
          <span>Giant group card for anyone leaving, signed by the whole team, tracked.</span>
        </label>
        {pricing ? (
          <div className="rounded-md bg-surface-2 p-3 text-sm" data-testid="batch-pricing">
            <div className="flex justify-between">
              <span>
                {pricing.cards - pricing.giantCards} cards at {formatPence(pricing.unitPence)}
              </span>
              <span className="tabular-nums">
                {formatPence(
                  (pricing.cards - pricing.giantCards - pricing.freeCards) * pricing.unitPence,
                )}
              </span>
            </div>
            {pricing.giantCards ? (
              <div className="flex justify-between">
                <span>{pricing.giantCards} Giant group card</span>
                <span className="tabular-nums">
                  {formatPence(pricing.giantCards * pricing.giantUnitPence)}
                </span>
              </div>
            ) : null}
            {pricing.freeCards ? (
              <div className="muted text-xs">
                {pricing.freeCards} cards included in the Automate plan
              </div>
            ) : null}
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-bold">
              <span>Total ex VAT</span>
              <span className="tabular-nums">{formatPence(pricing.totalPence)}</span>
            </div>
            <div className="muted mt-1 text-xs">
              Dearly&rsquo;s contribution {formatPence(pricing.contributionPence)}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={busy !== null || ready.length === 0}
          data-testid="schedule-all"
          onClick={() => void schedule()}
        >
          {busy === 'schedule' ? 'Scheduling…' : `Schedule all (${ready.length})`}
        </button>
        <p className="muted text-xs">
          Each card is sent on its date by the worker. Preview shows{' '}
          {template.replace('{first_name}', ready[0]?.name.split(' ')[0] ?? 'Aisha')}
        </p>
      </aside>
    </div>
  );
}
