import Link from 'next/link';

export function Tabs({
  tabs,
  current,
  base,
}: {
  tabs: { id: string; label: string; count?: number }[];
  current: string;
  base: string;
}) {
  return (
    <nav
      aria-label="Sections"
      className="scroll-x mb-6 border-b border-line"
      style={{ gap: 4, paddingBottom: 0 }}
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`${base}?tab=${t.id}`}
          aria-current={current === t.id ? 'page' : undefined}
          className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold ${current === t.id ? 'border-primary text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}
          data-testid={`tab-${t.id}`}
        >
          {t.label}
          {t.count != null ? (
            <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 text-xs">{t.count}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
