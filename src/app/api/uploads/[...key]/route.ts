import { getStorage } from '@/server/adapters/storage';
import { problem } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const found = await getStorage().get(key.join('/'));
  if (!found) return problem(404, 'Not found');
  return new Response(new Uint8Array(found.buffer), {
    headers: {
      'content-type': found.mimeType,
      'cache-control': 'private, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}
