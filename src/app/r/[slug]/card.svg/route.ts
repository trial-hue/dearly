import { now } from '@/server/clock';
import { problem } from '@/server/http';
import { cardSvg } from '@/server/render/cardSvg';
import { getOrderBySlug } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getOrderBySlug(slug, now());
  if (!found) return problem(404, 'Card not found');
  const svg = cardSvg({
    card: found.view.card,
    design: found.view.card.design,
    occasionType: found.view.occasionType,
    name: found.view.recipientName.split(' ')[0] ?? '',
  });
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'content-disposition': `attachment; filename="dearly-card-${slug.slice(0, 8)}.svg"`,
      'x-content-type-options': 'nosniff',
    },
  });
}
