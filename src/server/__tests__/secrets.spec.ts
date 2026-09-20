import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/** J4: no secret material is committed. Scans every tracked text file for known key shapes. */
const PATTERNS: [string, RegExp][] = [
  ['Anthropic key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['Slack token', /\bxox[abpr]-[A-Za-z0-9-]{10,}\b/],
  ['Stripe live key', /\bsk_live_[A-Za-z0-9]{16,}\b/],
];

describe('J4 no secrets in the repository', () => {
  it('finds no key-shaped strings in tracked files', () => {
    const files = execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .filter((f) => f && !/\.(png|jpg|jpeg|webp|ico|woff2?|pdf|snap)$/i.test(f));
    const hits: string[] = [];
    for (const file of files) {
      let text: string;
      try {
        text = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      for (const [name, re] of PATTERNS) if (re.test(text)) hits.push(`${file}: ${name}`);
    }
    expect(hits).toEqual([]);
    expect(files.some((f) => f === '.env')).toBe(false);
  });
});
