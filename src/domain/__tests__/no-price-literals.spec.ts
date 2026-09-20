import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Prices live in src/domain/constants.ts only. This scan fails when a currency amount or a
 * price-like literal appears in the app, the components or the server outside the allow-list.
 */
const ROOTS = ['src/app', 'src/components', 'src/server'];

// Files whose two-decimal numbers are not prices.
const ALLOW_FILES: RegExp[] = [
  /src\/app\/\(hq\)\/hq\/operations\/page\.tsx$/, // Moonpig's published figures in the thesis table
  /src\/server\/ai\/claudeProvider\.ts$/, // token prices and an exchange-rate assumption for the decision log
  /src\/server\/adapters\/printers\.ts$/, // simulated inspection score
];

// Lines that are clearly not money: CSS, SVG, animation, layout and version numbers.
const ALLOW_LINE =
  /strokeWidth|stroke-width|opacity|rotate\(|scale\(|rgba|translate|transform|animation|duration|ease|deviceScaleFactor|grid-cols|minmax|aspect|rate =|step: 0\.01|max: 0\.2|max: 5|min\(|\d+\.\d+\.\d+|\d{4}-\d{2}-\d{2}|version/;

const CURRENCY = /£\s?\d/;
const TWO_DECIMALS = /(^|[^\d.])\d+\.\d{2}(?![\d.])/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

describe('no price literals outside the domain', () => {
  it('finds no currency amounts or two-decimal literals in app, components or server', () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const file of walk(root)) {
        if (ALLOW_FILES.some((re) => re.test(file))) continue;
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
          if (ALLOW_LINE.test(line)) return;
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
          if (CURRENCY.test(line) || TWO_DECIMALS.test(line))
            offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        });
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
