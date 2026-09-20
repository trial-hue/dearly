/** One of the two places the airmail stripe survives. */
export function GuaranteeBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3 text-xs font-semibold"
      data-testid="guarantee-badge"
    >
      <span className="airmail-stripe inline-block h-4 w-8 rounded-full" aria-hidden="true" />
      {compact ? 'Delivery guarantee' : 'Arrives on time or your money back'}
    </span>
  );
}
