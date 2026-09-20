export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <Skeleton className="aspect-[5/7] w-full" />
          <Skeleton className="mt-2 h-5 w-24" />
        </li>
      ))}
    </ul>
  );
}
