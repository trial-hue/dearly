'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { forecast, toPence } from '@/domain';
import { api } from '@/lib/fetcher';
import { fmtDate, formatPence } from '@/lib/format';

const MIN = Math.log10(500);
const MAX = Math.log10(100_000);

/** Logarithmic slider (500 to 100,000 customers) driving a stacked-bar forecast. */
export function ForecastPanel({
  customers: initial,
  teamPerYear,
}: {
  customers: number;
  teamPerYear: number;
}) {
  const [customers, setCustomers] = useState(initial);
  const weeks = useMemo(() => forecast(customers, new Date()), [customers]);
  const max = Math.max(1, ...weeks.map((w) => w.total));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (customers === initial) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () =>
        void api('/api/operations', {
          method: 'PATCH',
          json: { forecastCustomers: customers },
        }).catch(() => undefined),
      500,
    );
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [customers, initial]);

  const W = 720;
  const H = 220;
  const padL = 44;
  const padB = 34;
  const padT = 10;
  const barW = (W - padL - 8) / weeks.length;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const ordersPerYear = customers * 4;
  const teamCostPence = Math.round(toPence(teamPerYear) / ordersPerYear);
  const total = weeks.reduce((s, w) => s + w.total, 0);

  return (
    <div className="card" data-testid="forecast">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex-1" htmlFor="forecast-customers">
          <span className="text-xs font-medium text-ink-2">
            Simulated customers: {customers.toLocaleString('en-GB')}
          </span>
          <input
            id="forecast-customers"
            type="range"
            min={0}
            max={1000}
            value={Math.round(((Math.log10(customers) - MIN) / (MAX - MIN)) * 1000)}
            onChange={(e) =>
              setCustomers(
                Math.round(10 ** (MIN + (Number(e.target.value) / 1000) * (MAX - MIN)) / 10) * 10,
              )
            }
            className="mt-1 w-full"
          />
        </label>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="muted text-xs">Orders in 13 weeks</dt>
            <dd className="font-bold tabular-nums">{total.toLocaleString('en-GB')}</dd>
          </div>
          <div>
            <dt className="muted text-xs">Orders a year</dt>
            <dd className="font-bold tabular-nums">{ordersPerYear.toLocaleString('en-GB')}</dd>
          </div>
          <div>
            <dt className="muted text-xs">Team cost an order</dt>
            <dd className="font-bold tabular-nums" data-testid="team-cost-per-order">
              {formatPence(teamCostPence)}
            </dd>
          </div>
        </dl>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-label={`Weekly orders for ${customers} customers, split by advance post, tracked and pick-up`}
      >
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={padL}
              x2={W - 8}
              y1={y(max * f)}
              y2={y(max * f)}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text x={padL - 6} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill="var(--ink2)">
              {Math.round(max * f).toLocaleString('en-GB')}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const x = padL + i * barW + 3;
          const bw = barW - 6;
          const yA = y(w.advance);
          const yT = y(w.advance + w.tracked);
          const yP = y(w.total);
          return (
            <g key={i}>
              <rect x={x} y={yA} width={bw} height={y(0) - yA} style={{ fill: 'var(--blue)' }} />
              <rect x={x} y={yT} width={bw} height={yA - yT} style={{ fill: 'var(--green)' }} />
              <rect x={x} y={yP} width={bw} height={yT - yP} style={{ fill: 'var(--amber)' }} />
              {w.peak ? (
                <text x={x + bw / 2} y={yP - 4} textAnchor="middle" fontSize="9" fill="var(--red)">
                  ×{w.multiplier}
                </text>
              ) : null}
              {i % 2 === 0 ? (
                <text
                  x={x + bw / 2}
                  y={H - padB + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--ink2)"
                >
                  {fmtDate(w.weekStart).replace(/^\w+ /, '')}
                </text>
              ) : null}
            </g>
          );
        })}
        <g fontSize="10" fill="var(--ink2)">
          <rect x={padL} y={H - 12} width="10" height="10" style={{ fill: 'var(--blue)' }} />
          <text x={padL + 14} y={H - 3}>
            Advance post 72%
          </text>
          <rect x={padL + 120} y={H - 12} width="10" height="10" style={{ fill: 'var(--green)' }} />
          <text x={padL + 134} y={H - 3}>
            Tracked 20%
          </text>
          <rect x={padL + 220} y={H - 12} width="10" height="10" style={{ fill: 'var(--amber)' }} />
          <text x={padL + 234} y={H - 3}>
            Pick-up 8%
          </text>
          <text x={padL + 320} y={H - 3}>
            Peaks: Christmas ×2.6, Mother&rsquo;s Day ×2.4, Valentine ×1.8
          </text>
        </g>
      </svg>
    </div>
  );
}
