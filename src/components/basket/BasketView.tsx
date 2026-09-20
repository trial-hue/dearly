'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CardMock } from '@/components/card/CardMock';
import { useToast } from '@/components/shell/Toast';
import { GuaranteeBadge } from '@/components/store/GuaranteeBadge';
import { ErrorNote } from '@/components/ui';
import { FINISHES, MODES, PICKUP_PROMISE, SIZES } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { fmtDate, formatPence } from '@/lib/format';
import type { Serialized } from '@/lib/serialize';
import type { ProposalView } from '@/server/services/proposals';

import { useBasket } from './basketStore';

type ProposalDTO = Serialized<ProposalView>;

export function BasketView() {
  const basket = useBasket();
  const router = useRouter();
  const { toast } = useToast();
  const { run, busy, error } = useAction();
  const [items, setItems] = useState<ProposalDTO[] | null>(null);
  const keyList = JSON.stringify(basket.keys);

  useEffect(() => {
    let cancelled = false;
    const keys = JSON.parse(keyList) as string[];
    Promise.all(
      keys.map((k) =>
        api<ProposalDTO>(`/api/proposals/${encodeURIComponent(k)}`).catch(() => null),
      ),
    ).then((rows) => {
      if (cancelled) return;
      const live = rows.filter((r): r is ProposalDTO => r !== null && r.status === 'proposed');
      setItems(live);
    });
    return () => {
      cancelled = true;
    };
  }, [keyList]);

  const total = (items ?? []).reduce((s, p) => s + p.quote.totalPence, 0);
  const blocked = (items ?? []).filter((p) => !p.approvable);

  const pay = () =>
    run('pay', async () => {
      for (const p of items ?? []) {
        await api(`/api/proposals/${encodeURIComponent(p.key)}`, {
          method: 'PATCH',
          json: { action: 'approve' },
        });
        basket.remove(p.key);
      }
      toast('Paid. Your cards are on the way.');
      router.push('/orders');
    });

  if (items === null)
    return <div className="skeleton h-40" aria-busy="true" aria-label="Loading your basket" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <h1 className="t-h1">Your basket is empty</h1>
        <p className="mt-2 text-ink-2">
          Pick a card to personalise, or approve one of the cards we have ready for you.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/cards" className="btn btn-primary btn-lg">
            Browse cards
          </Link>
          <Link href="/reminders" className="btn btn-lg">
            Ready for you
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="t-h1">Basket</h1>
        <ul className="mt-6 space-y-4" data-testid="basket-items">
          {items.map((p) => {
            const first = p.person.name.split(' ')[0];
            return (
              <li key={p.key} className="panel flex gap-4" data-testid={`basket-item-${p.key}`}>
                <div className="w-[120px] shrink-0">
                  <CardMock
                    card={p.card}
                    title={p.title}
                    name={first}
                    age={p.age}
                    bare
                    hover={false}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="t-h3">
                    {p.title} for {p.person.name}
                  </h2>
                  <p className="text-sm text-ink-2">
                    {p.card.mode === 'ecard'
                      ? 'eCard, sent by link today'
                      : `${SIZES[p.card.size].label}, ${FINISHES[p.card.finish].label} · ${MODES[p.card.mode].label}, ${p.card.mode === 'pickup' ? PICKUP_PROMISE.charAt(0).toLowerCase() + PICKUP_PROMISE.slice(1) : `arrives ${fmtDate(p.arrival)}`}`}
                    {p.card.digital ? ' · digital copy' : ''}
                    {p.card.gift !== 'none' ? ' · with a gift' : ''}
                  </p>
                  <p className="mt-1 line-clamp-2 font-hand text-lg leading-tight">
                    {p.card.message}
                  </p>
                  {!p.approvable && p.blockReason === 'address_stale' ? (
                    <p className="mt-2 text-sm text-warning">
                      Please confirm {first}&rsquo;s address before paying.{' '}
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          run(
                            'confirm',
                            async () => {
                              await api(`/api/proposals/${encodeURIComponent(p.key)}`, {
                                method: 'PATCH',
                                json: { action: 'confirm_address' },
                              });
                              setItems(
                                (cur) =>
                                  cur?.map((x) =>
                                    x.key === p.key
                                      ? { ...x, approvable: true, blockReason: null }
                                      : x,
                                  ) ?? null,
                              );
                            },
                            { refresh: false },
                          )
                        }
                      >
                        The address is still right
                      </button>
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="t-price">{formatPence(p.quote.totalPence)}</span>
                    <Link href={`/personalise/${encodeURIComponent(p.key)}`} className="btn btn-sm">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => basket.remove(p.key)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="panel self-start lg:sticky lg:top-24" data-testid="basket-summary">
        <h2 className="t-h3">Summary</h2>
        <dl className="mt-3 space-y-1 text-sm">
          {items.map((p) => (
            <div key={p.key} className="flex justify-between gap-3">
              <dt className="text-ink-2">
                {p.person.name.split(' ')[0]}: card {p.card.mode === 'ecard' ? '' : 'and delivery'}
              </dt>
              <dd className="tabular-nums">{formatPence(p.quote.totalPence)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-line pt-2 text-base font-bold">
            <dt>Total, delivery included</dt>
            <dd className="tabular-nums" data-testid="basket-total">
              {formatPence(total)}
            </dd>
          </div>
        </dl>
        <p className="mt-3">
          <GuaranteeBadge />
        </p>
        <button
          type="button"
          className="btn btn-primary btn-lg mt-4 w-full"
          disabled={busy !== null || blocked.length > 0}
          data-testid="basket-pay"
          onClick={() => void pay()}
        >
          {busy === 'pay' ? 'Paying…' : `Pay ${formatPence(total)}`}
        </button>
        {blocked.length ? (
          <p className="mt-2 text-xs text-ink-2">Confirm the addresses above to pay.</p>
        ) : null}
        <ErrorNote message={error} />
      </aside>
    </div>
  );
}
