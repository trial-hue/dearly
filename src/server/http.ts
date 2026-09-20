import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';

/** Problem JSON (RFC 9457 shape) for every API error. */
export function problem(status: number, title: string, detail?: string): NextResponse {
  return NextResponse.json({ type: 'about:blank', title, status, detail }, { status });
}

export async function readJson<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: problem(400, 'Invalid JSON body') };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: problem(
        400,
        'Invalid request',
        parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '),
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
