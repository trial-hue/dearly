import { CardMock } from '@/components/card/CardMock';
import { RULES } from '@/domain';
import { daysLabel, fmtDate } from '@/lib/format';
import { OCCASION_LABELS } from '@/lib/occasions';
import type { TodayScreen } from '@/server/services/proposals';

import { reminderHeadline } from './ReminderCard';

const monthOf = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

/** A month-grouped timeline of what is further out, plus anyone paused. */
export function ComingUp({ screen }: { screen: TodayScreen }) {
  const items = [
    ...screen.later.map((p) => ({
      key: p.key,
      date: p.dueDate,
      headline: reminderHeadline(p),
      sub: `Ready for you on ${fmtDate(new Date(new Date(p.dueDate).getTime() - RULES.proposalWindowDays * 86_400_000))}`,
      card: p.card,
      title: p.title,
      name: p.person.name.split(' ')[0] ?? '',
      age: p.age,
    })),
    ...screen.beyond.map((b) => ({
      key: `${b.personId}-${b.occasionType}`,
      date: b.date,
      headline: `${b.name.split(' ')[0]}'s ${OCCASION_LABELS[b.occasionType].toLowerCase()}`,
      sub: `Further ahead, ${daysLabel(b.daysLeft)}`,
      card: null,
      title: OCCASION_LABELS[b.occasionType],
      name: '',
      age: null,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const m = monthOf(it.date);
    groups.set(m, [...(groups.get(m) ?? []), it]);
  }
  return (
    <div className="space-y-8" data-testid="coming-up">
      {items.length === 0 ? (
        <p className="text-ink-2">
          Nothing further out yet. Add dates and they appear here months ahead.
        </p>
      ) : null}
      {[...groups.entries()].map(([month, list]) => (
        <section key={month}>
          <h2 className="t-h3 mb-3">{month}</h2>
          <ol className="space-y-2">
            {list.map((it) => (
              <li key={it.key} className="flex items-center gap-3 rounded-[12px] bg-surface-2 p-3">
                <div className="w-[56px] shrink-0">
                  {it.card ? (
                    <CardMock
                      card={it.card}
                      title={it.title}
                      name={it.name}
                      age={it.age}
                      bare
                      hover={false}
                    />
                  ) : (
                    <div className="paper aspect-[5/7] w-full" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{it.headline}</p>
                  <p className="text-sm text-ink-2">
                    {fmtDate(it.date)} · {it.sub}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {screen.paused.length ? (
        <section>
          <h2 className="t-h3 mb-3">Paused for now</h2>
          <ul className="space-y-2">
            {screen.paused.map((p) => (
              <li
                key={p.id}
                className="rounded-[12px] bg-surface-2 p-3 text-sm"
                data-testid={`paused-${p.id}`}
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-ink-2">
                  {' '}
                  · No cards will be sent for now. Resume any time under People and dates.
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
