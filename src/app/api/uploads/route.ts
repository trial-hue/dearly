import { getAccountId } from '@/server/auth';
import { ok, problem } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { isMediaKind, storeUpload } from '@/server/services/media';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const accountId = await getAccountId();
  const limit = rateLimit(`upload:${accountId}`, 30);
  if (!limit.ok)
    return problem(429, 'Too many uploads', `Try again in ${limit.retryAfterSec} seconds`);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return problem(400, 'Expected multipart form data');
  }
  const kind = String(form.get('kind') ?? '');
  const file = form.get('file');
  if (!isMediaKind(kind)) return problem(400, 'Unknown media kind');
  if (!(file instanceof File)) return problem(400, 'Missing file');
  const result = await storeUpload(accountId, kind, file);
  if (!result.ok) return problem(result.status, 'Upload rejected', result.error);
  return ok(result, 201);
}
