import type { Metadata } from 'next';

import { EconomicsPanel } from '@/components/operations/EconomicsPanel';
import { ForecastPanel } from '@/components/operations/ForecastPanel';
import { PageHeader } from '@/components/shell/PageHeader';
import { Badge, Simulated, Stat } from '@/components/ui';
import { fmtDate, fmtTime, formatPence } from '@/lib/format';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { operationsScreen } from '@/server/services/operations';

export const metadata: Metadata = { title: 'Operations' };
export const dynamic = 'force-dynamic';

const THESIS: [string, string, string][] = [
  [
    'Customers and orders',
    '12.3m customers, 36.0m orders (FY26)',
    'A pilot account today; the same flows at any size',
  ],
  [
    'Marketing',
    '£38.7m a year (FY26)',
    'Recipients join from the QR loop and florist referrals at no acquisition cost',
  ],
  [
    'Data and engineering',
    '242 data scientists, analysts and engineers (FY24)',
    'One product and AI engineer; the AI drafts, chooses, cleans, reads and answers',
  ],
  [
    'Production',
    'Own factories',
    'Six partner printers routed by postcode; the specialist for anything unusual',
  ],
  [
    'Customer care',
    'Humans 9am to 5:30pm, no phone line',
    'An AI agent around the clock, on chat and phone, escalating to one person',
  ],
  ['Card stock', '250 to 300gsm', 'Three finishes to 400gsm, three sizes up to A3'],
  [
    'Team',
    'Thousands of people',
    'Three: product and AI, operations and partners, growth and care',
  ],
];

const ROLES = [
  {
    title: 'Product and AI engineer',
    does: 'Owns the product, the prompts and the gateway.',
    ai: [
      'Drafts every message and chooses every option',
      'Draws card fronts and checks photos',
      'Reads what customers paste and tell it',
    ],
  },
  {
    title: 'Operations and partners',
    does: 'Signs printers, florists and shops; watches the scorecards.',
    ai: [
      'Routes every order and inspects every print',
      'Detects delays and runs recovery',
      'Cleans staff lists and schedules business batches',
    ],
  },
  {
    title: 'Growth and customer care',
    does: 'Talks to the customers the agent escalates; grows the loops.',
    ai: [
      'Answers support and acts within the rules',
      'Turns florist orders into reminders',
      'Pauses cards when life changes',
    ],
  },
];

export default async function OperationsPage() {
  const accountId = await getAccountId();
  const s = await operationsScreen(accountId, now());
  const c = s.counters;
  return (
    <>
      <PageHeader
        title="Operations"
        lede="The thesis, live: what a Moonpig-sized business needs against what Dearly needs when the AI does the operating work."
      />

      <div className="tbl-wrap">
        <table className="table" data-testid="thesis">
          <thead>
            <tr>
              <th>Area</th>
              <th>What Moonpig runs</th>
              <th>What Dearly runs</th>
            </tr>
          </thead>
          <tbody>
            {THESIS.map(([area, m, d]) => (
              <tr key={area}>
                <td className="font-medium">{area}</td>
                <td className="whitespace-normal">{m}</td>
                <td className="whitespace-normal">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted mt-1 text-xs">
        Moonpig figures from its published reports and help pages. Dearly figures are pilot
        assumptions.
      </p>

      <h2 className="section-title">Three roles</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.title} className="card">
            <h3 className="font-bold">{r.title}</h3>
            <p className="muted text-sm">{r.does}</p>
            <p className="mt-2 text-xs font-medium text-success">What the AI does for them</p>
            <ul className="list-disc pl-4 text-sm">
              {r.ai.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="section-title">This session</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4" data-testid="counters">
        <Stat label="Reminders" value={c.reminders} />
        <Stat
          label="Proposals"
          value={c.proposals}
          note={`${c.approved} approved, ${c.skipped} skipped`}
        />
        <Stat
          label="Approval rate"
          value={c.approvalRate == null ? '—' : `${c.approvalRate}%`}
          note={`${c.approved + c.skipped} decided`}
        />
        <Stat
          label="By advance post"
          value={c.advanceShare == null ? '—' : `${c.advanceShare}%`}
          note={`${c.advanceOrders} of ${c.printedOrders} printed`}
        />
        <Stat
          label="Postage saved vs first class"
          value={formatPence(c.postageSavedPence)}
          note="estimate: second class instead of first, per advance order"
        />
        <Stat
          label="Average contribution"
          value={c.avgContributionPence == null ? '—' : formatPence(c.avgContributionPence)}
          note="per order"
        />
        <Stat
          label="Decisions"
          value={c.decisionsByActor.ai + c.decisionsByActor.rule + c.decisionsByActor.person}
          note={`${c.decisionsByActor.ai} AI, ${c.decisionsByActor.rule} rules, ${c.decisionsByActor.person} people`}
        />
        <Stat
          label="Recipients joined"
          value={c.recipientsJoined}
          note={`${c.referrals} florist referrals, ${c.batches} batches`}
        />
      </div>

      <h2 className="section-title">13-week forecast</h2>
      <ForecastPanel
        customers={s.settings.forecastCustomers}
        teamPerYear={s.settings.costs.teamPerYear}
      />

      <h2 className="section-title">Unit economics</h2>
      <EconomicsPanel costs={s.settings.costs} customers={s.settings.forecastCustomers} />

      <h2 className="section-title">Printer scorecards</h2>
      <div className="tbl-wrap">
        <table className="table" data-testid="printers">
          <thead>
            <tr>
              <th>Printer</th>
              <th>City</th>
              <th>Sizes</th>
              <th>Finishes</th>
              <th className="num">Capacity a day</th>
              <th className="num">Orders routed</th>
              <th className="num">Score</th>
            </tr>
          </thead>
          <tbody>
            {s.printers.map((p) => (
              <tr key={p.id} data-testid={`printer-${p.id}`}>
                <td>
                  {p.name} <Simulated />
                </td>
                <td>{p.city}</td>
                <td>{p.sizes.join(', ')}</td>
                <td>{p.finishes.join(', ')}</td>
                <td className="num">{p.capacity.toLocaleString('en-GB')}</td>
                <td className="num">{p.ordersRouted}</td>
                <td className="num" data-testid="printer-score">
                  {p.blended.toFixed(2)}
                  {p.ratings ? (
                    <span className="muted text-xs">
                      {' '}
                      ({p.ratings} rating{p.ratings === 1 ? '' : 's'})
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {s.batches.length || s.referrals.length ? (
        <>
          <h2 className="section-title">Business and partners</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="card text-sm">
              <h3 className="font-bold">Batches</h3>
              {s.batches.length ? (
                <ul className="mt-1 space-y-1">
                  {s.batches.map((b) => (
                    <li key={b.id} data-testid="ops-batch">
                      {b.organisation.name}: {b.cardCount} cards by{' '}
                      {b.deliveryOption === 'posted' ? 'home post' : 'office drop'} from{' '}
                      {fmtDate(b.sendDate)}, {formatPence(b.pricePence)} ex VAT, contribution{' '}
                      {formatPence(b.contributionPence)} <Badge>{b.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">None yet.</p>
              )}
            </div>
            <div className="card text-sm">
              <h3 className="font-bold">Florist referrals</h3>
              {s.referrals.length ? (
                <ul className="mt-1 space-y-1">
                  {s.referrals.map((r) => {
                    const l = r.ledger as {
                      customer?: string;
                      recipient?: string;
                      referralFeePence?: number;
                      expectedCommissionPence?: number;
                    };
                    return (
                      <li key={r.id}>
                        {r.partner.name}: reminder for {l.customer ?? 'a customer'} (
                        {l.recipient ?? r.person?.name}), fee {formatPence(l.referralFeePence ?? 0)}
                        , commission {formatPence(l.expectedCommissionPence ?? 0)} next year
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="muted">None yet.</p>
              )}
            </div>
          </div>
        </>
      ) : null}

      <h2 className="section-title">Latest decisions</h2>
      <p className="muted -mt-1 mb-2 text-sm">
        Every automated step and every human choice, with who made it. {c.openJobs} scheduled job
        {c.openJobs === 1 ? '' : 's'} waiting for the worker.
      </p>
      <ol
        className="divide-y divide-line rounded-lg border border-line bg-surface text-sm"
        data-testid="decisions"
      >
        {s.decisions.map((d) => (
          <li key={d.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2">
            <span className="muted w-28 shrink-0 text-xs tabular-nums">{fmtTime(d.at)}</span>
            <Badge kind={d.actor === 'ai' ? 'ai' : d.actor === 'person' ? 'flag' : 'plain'}>
              {d.actor === 'ai' ? 'AI' : d.actor === 'rule' ? 'rule' : 'person'}
            </Badge>
            <span className="muted text-xs">{d.job.replace(/_/g, ' ')}</span>
            <span className="min-w-0 flex-1 basis-full sm:basis-auto">{d.summary}</span>
            {d.costMicroPence ? (
              <span className="muted text-xs tabular-nums">
                {(d.costMicroPence / 1_000_000).toFixed(3)}p
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </>
  );
}
