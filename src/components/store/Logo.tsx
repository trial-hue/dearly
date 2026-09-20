import Link from 'next/link';

export function Logo({ href = '/', suffix }: { href?: string; suffix?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full"
      aria-label={suffix ? `Dearly ${suffix}` : 'Dearly home'}
    >
      <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
        <rect x="1.5" y="2.5" width="27" height="19" rx="4" fill="var(--primary)" />
        <path
          d="M4 6.5 L15 14 L26 6.5"
          fill="none"
          stroke="var(--on-primary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[22px] font-extrabold tracking-tight">
        Dearly{suffix ? <span className="ml-1.5 font-semibold text-ink-2">{suffix}</span> : null}
      </span>
    </Link>
  );
}
