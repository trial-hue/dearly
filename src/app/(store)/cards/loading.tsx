import { ProductGridSkeleton, Skeleton } from '@/components/store/Skeleton';

export default function Loading() {
  return (
    <div className="container-x pb-10 pt-6 md:pt-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-2 h-5 w-96" />
      <Skeleton className="mt-6 h-10 w-full" />
      <div className="mt-6">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
