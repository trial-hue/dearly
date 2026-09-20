export function PageHeader({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-[28px]">{title}</h1>
        {lede ? <p className="muted mt-0.5 max-w-prose text-sm">{lede}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}
