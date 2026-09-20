/**
 * Captures the key storefront screens at phone (390×844) and desktop (1440×900) sizes into
 * docs/design/screens/. Needs a running server on http://localhost:3000 with seeded data:
 *   pnpm build && pnpm start:local   (in another terminal)
 *   pnpm screenshots
 */
import { chromium, type Page } from '@playwright/test';

const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000';
const OUT = 'docs/design/screens';

const SCREENS: {
  name: string;
  path: string;
  after?: (page: Page) => Promise<void>;
}[] = [
  { name: 'home', path: '/' },
  { name: 'browse', path: '/cards/birthday' },
  { name: 'product', path: '/card/bday-balloon-bunch' },
  { name: 'personalise', path: '/personalise/person_margaret%7Cbirthday%7C2026?from=reminder' },
  { name: 'reminders', path: '/reminders' },
  {
    name: 'basket',
    path: '/basket',
    after: async (page) => {
      await page.evaluate(() =>
        localStorage.setItem('dearly-basket', JSON.stringify(['person_dan|birthday|2026'])),
      );
      await page.reload({ waitUntil: 'networkidle' });
      await page
        .getByTestId('basket-items')
        .waitFor({ timeout: 10_000 })
        .catch(() => undefined);
    },
  },
  { name: 'orders', path: '/orders' },
  { name: 'recipient', path: '/r/seed-dan-birthday-delivered-2025' },
];

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const warm = await browser.newPage();
  await warm.goto(`${BASE}/reminders`, { waitUntil: 'networkidle' }); // creates the seeded proposals
  await warm.close();
  for (const [width, height, tag] of [
    [1440, 900, 'desktop'],
    [390, 844, 'phone'],
  ] as const) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    for (const s of SCREENS) {
      const page = await context.newPage();
      await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle' });
      if (s.after) await s.after(page);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/${s.name}-${tag}.png`, fullPage: false });
      await page.close();
      console.log(`${s.name}-${tag}.png`);
    }
    await context.close();
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
