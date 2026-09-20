import type { ReactNode } from 'react';

export function Badge({
  kind = 'plain',
  children,
  title,
}: {
  kind?: 'plain' | 'ai' | 'flag' | 'danger' | 'sim';
  children: ReactNode;
  title?: string;
}) {
  const cls =
    kind === 'ai'
      ? 'label label-ai'
      : kind === 'flag'
        ? 'label label-flag'
        : kind === 'danger'
          ? 'label label-danger'
          : 'label';
  return (
    <span className={cls} title={title}>
      {children}
    </span>
  );
}

export function Simulated({ what }: { what?: string }) {
  return (
    <Badge title="Nothing real happens here; the partner is simulated">
      {what ? `${what} (simulated)` : 'simulated'}
    </Badge>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink2">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink2">{hint}</p> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-ink2">
      {children}
    </p>
  );
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <div className="text-[11px] font-medium text-ink2">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      {note ? <div className="text-xs text-ink2">{note}</div> : null}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-dangerbg px-3 py-2 text-sm text-red">
      {message}
    </p>
  );
}
