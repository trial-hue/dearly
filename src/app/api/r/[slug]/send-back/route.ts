import { now } from '@/server/clock';
import { ok, problem } from '@/server/http';
import { sendOneBack } from '@/server/services/orders';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = await sendOneBack(slug, now());
  return key ? ok({ key }) : problem(404, 'Card not found');
}
