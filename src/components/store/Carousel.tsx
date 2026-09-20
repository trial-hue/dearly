'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

/** A horizontally scrolling row with snap points, keyboard-operable buttons and "See all". */
export function Carousel({
  title,
  seeAllHref,
  children,
  itemWidth = 'w-[170px] md:w-[220px]',
  testId,
}: {
  title: string;
  seeAllHref?: string;
  children: React.ReactNode[];
  itemWidth?: string;
  testId?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const by = (dir: 1 | -1) =>
    ref.current?.scrollBy({
      left: dir * Math.max(240, ref.current.clientWidth * 0.8),
      behavior: 'smooth',
    });
  return (
    <section aria-label={title} className="section !pb-0" data-testid={testId}>
      <div className="container-x mb-4 flex items-center gap-3">
        <h2 className="t-h2">{title}</h2>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="ml-auto text-sm font-semibold underline-offset-4 hover:underline"
          >
            See all
          </Link>
        ) : null}
        <div className="hidden gap-1 md:flex">
          <button
            type="button"
            className="btn btn-sm"
            aria-label={`Scroll ${title} back`}
            onClick={() => by(-1)}
          >
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-sm"
            aria-label={`Scroll ${title} forward`}
            onClick={() => by(1)}
          >
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul ref={ref} className="scroll-x container-x" tabIndex={0} aria-label={`${title} items`}>
        {children.map((child, i) => (
          <li key={i} className={itemWidth}>
            {child}
          </li>
        ))}
      </ul>
    </section>
  );
}
