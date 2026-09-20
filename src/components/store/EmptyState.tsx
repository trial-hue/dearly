import Link from 'next/link';

export function EmptyState({
  title,
  text,
  cta,
  ctaHref,
  testId = 'empty-state',
}: {
  title: string;
  text?: string;
  cta?: string;
  ctaHref?: string;
  testId?: string;
}) {
  return (
    <div
      className="mx-auto max-w-md rounded-[12px] bg-surface-2 px-6 py-10 text-center"
      data-testid={testId}
    >
      <h2 className="t-h3">{title}</h2>
      {text ? <p className="mt-1 text-sm text-ink-2">{text}</p> : null}
      {cta && ctaHref ? (
        <Link href={ctaHref} className="btn btn-primary mt-4">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
