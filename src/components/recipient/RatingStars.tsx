'use client';

export function RatingStars({
  value,
  onRate,
  disabled = false,
}: {
  value: number;
  onRate: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          data-testid={`star-${n}`}
          className={`text-3xl leading-none transition-transform duration-150 ease-out hover:scale-110 ${n <= value ? 'text-warning' : 'text-line'}`}
          disabled={disabled}
          onClick={() => onRate(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
