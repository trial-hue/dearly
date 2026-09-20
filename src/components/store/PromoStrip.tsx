export function PromoStrip({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-ink text-bg">
      <p className="container-x py-2 text-center text-[13px] font-semibold">
        {children ?? 'Arrives on time or it’s free. First card free when you add your dates.'}
      </p>
    </div>
  );
}
