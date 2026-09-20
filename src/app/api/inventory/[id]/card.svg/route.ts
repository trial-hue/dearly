import { getAccountId } from '@/server/auth';
import { problem } from '@/server/http';
import { cardSvg } from '@/server/render/cardSvg';
import { getInventoryItem } from '@/server/services/inventory';
import { parseCard } from '@/server/services/proposals';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accountId = await getAccountId();
  const item = await getInventoryItem(id, accountId);
  if (!item) return problem(404, 'Card not found');
  let card = null;
  try {
    card = item.cardSpec ? parseCard(item.cardSpec) : null;
  } catch {
    card = null;
  }
  const svg = cardSvg({
    card,
    design: item.design,
    occasionType: item.occasionType,
    name: (item.direction === 'sent' ? item.toName : item.toName).split(' ')[0] ?? '',
  });
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'content-disposition': `attachment; filename="dearly-${item.design}-${item.receivedAt.toISOString().slice(0, 10)}.svg"`,
      'x-content-type-options': 'nosniff',
    },
  });
}
