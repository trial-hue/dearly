import { randomBytes } from 'node:crypto';

/** 22-character URL-safe slug from 16 random bytes: unguessable recipient links. */
export function newSlug(): string {
  return randomBytes(16).toString('base64url');
}
