import { createHmac, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';

import { env } from '@/env';

export const DEMO_ACCOUNT_ID = 'acct_demo';
export const SESSION_COOKIE = 'dearly_session';

function sign(value: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(value).digest('base64url');
}

/** value.signature, signed with SESSION_SECRET. */
export function encodeSession(accountId: string): string {
  return `${accountId}.${sign(accountId)}`;
}

export function decodeSession(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const value = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(value);
  if (sig.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? value : null;
}

/**
 * The account for this request. The pilot has one seeded demo account; a signed cookie can
 * select another. Real authentication plugs in here.
 */
export async function getAccountId(): Promise<string> {
  try {
    const jar = await cookies();
    return decodeSession(jar.get(SESSION_COOKIE)?.value) ?? DEMO_ACCOUNT_ID;
  } catch {
    return DEMO_ACCOUNT_ID;
  }
}

export function sessionCookie(accountId: string) {
  return {
    name: SESSION_COOKIE,
    value: encodeSession(accountId),
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}
