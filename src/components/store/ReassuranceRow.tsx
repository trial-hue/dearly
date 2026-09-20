import { Layers, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Delivery guarantee',
    text: 'Arrives on time or your money back, and we fix it before you notice.',
  },
  {
    icon: Layers,
    title: 'Three finishes',
    text: 'Classic, Signature and Luxe, in Regular, Large and Giant.',
  },
  {
    icon: Sparkles,
    title: 'A saved copy for them',
    text: 'Every card lives on in their Dearly for three years.',
  },
  {
    icon: UsersRound,
    title: 'Real people when it matters',
    text: 'Our help agent answers day and night and hands over to a person when it counts.',
  },
];

export function ReassuranceRow() {
  return (
    <section className="container-x section" aria-label="Why Dearly">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="panel flex gap-3">
            <span className="shrink-0 rounded-full bg-surface p-2.5 text-primary">
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold">{title}</span>
              <span className="block text-sm text-ink-2">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
