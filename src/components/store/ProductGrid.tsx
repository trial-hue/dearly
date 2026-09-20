import type { DesignDef } from '@/catalogue';

import { ProductTile } from './ProductTile';

export function ProductGrid({
  designs,
  testId = 'product-grid',
}: {
  designs: DesignDef[];
  testId?: string;
}) {
  return (
    <ul
      className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4"
      data-testid={testId}
    >
      {designs.map((d, i) => (
        <li key={d.id}>
          <ProductTile design={d} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
