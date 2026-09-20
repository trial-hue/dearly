'use client';

import { useEffect, useRef, useState } from 'react';

import { Field } from '@/components/ui';
import { FINISHES, MODES, SIZES, economics, type Costs } from '@/domain';
import { api } from '@/lib/fetcher';
import { formatPence } from '@/lib/format';

const FIELDS: { key: keyof Costs; label: string; step: number; hint: string }[] = [
  { key: 'payPct', label: 'Payment fee, share', step: 0.001, hint: 'e.g. 0.015 for 1.5%' },
  { key: 'payFixed', label: 'Payment fee, fixed £', step: 0.01, hint: 'per order' },
  { key: 'ai', label: 'AI £ per order', step: 0.01, hint: 'drafting, choosing, checking' },
  { key: 'service', label: 'Service £ per order', step: 0.01, hint: 'hosting, support tooling' },
  { key: 'guarantee', label: 'Guarantee £ per order', step: 0.01, hint: 'expected recovery cost' },
  { key: 'teamPerYear', label: 'Team £ a year', step: 1000, hint: 'three people' },
];

/** Editable costs feeding the nine-combination contribution table and the break-even figure. */
export function EconomicsPanel({ costs: initial, customers }: { costs: Costs; customers: number }) {
  const [costs, setCosts] = useState<Costs>(initial);
  const e = economics(costs);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (costs === initial) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () =>
        void api('/api/operations', { method: 'PATCH', json: { costs } }).catch(() => undefined),
      500,
    );
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [costs, initial]);
  const perOrder = e.teamCostPerOrderPence(customers * 4);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]" data-testid="economics">
      <div className="card space-y-2">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`cost-${f.key}`} hint={f.hint}>
            <input
              id={`cost-${f.key}`}
              type="number"
              step={f.step}
              min={0}
              className="input"
              value={costs[f.key]}
              onChange={(ev) => setCosts({ ...costs, [f.key]: Number(ev.target.value) })}
            />
          </Field>
        ))}
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <div className="text-[11px] font-medium text-ink2">Blended contribution</div>
            <div className="text-lg font-bold tabular-nums">
              {formatPence(e.blendedContributionPence)}
            </div>
            <div className="text-xs text-ink2">Regular Signature, 72/20/8 mix</div>
          </div>
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <div className="text-[11px] font-medium text-ink2">Break-even orders a year</div>
            <div className="text-lg font-bold tabular-nums" data-testid="break-even">
              {Number.isFinite(e.breakEvenOrders) ? e.breakEvenOrders.toLocaleString('en-GB') : '—'}
            </div>
            <div className="text-xs text-ink2">
              {Number.isFinite(e.breakEvenCustomers)
                ? `${e.breakEvenCustomers.toLocaleString('en-GB')} customers at 4 a year`
                : 'no contribution'}
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <div className="text-[11px] font-medium text-ink2">Team cost an order</div>
            <div className="text-lg font-bold tabular-nums">{formatPence(perOrder)}</div>
            <div className="text-xs text-ink2">
              at {customers.toLocaleString('en-GB')} customers
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <div className="text-[11px] font-medium text-ink2">Team £ a year</div>
            <div className="text-lg font-bold tabular-nums">
              £{costs.teamPerYear.toLocaleString('en-GB')}
            </div>
            <div className="text-xs text-ink2">three people</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="table" data-testid="contribution-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Finish</th>
                <th>Delivery</th>
                <th className="num">Price inc VAT</th>
                <th className="num">Ex VAT</th>
                <th className="num">Costs</th>
                <th className="num">Contribution</th>
                <th className="num">Margin</th>
              </tr>
            </thead>
            <tbody>
              {e.table.map((r) => (
                <tr key={`${r.size}-${r.finish}`}>
                  <td>{SIZES[r.size].label}</td>
                  <td>{FINISHES[r.finish].label}</td>
                  <td>{MODES[r.mode].label}</td>
                  <td className="num">{formatPence(r.pricePence)}</td>
                  <td className="num">{formatPence(r.exVatPence)}</td>
                  <td className="num">{formatPence(r.costPence)}</td>
                  <td className="num font-bold" data-testid="contribution">
                    {formatPence(r.contributionPence)}
                  </td>
                  <td className="num">{r.marginPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
