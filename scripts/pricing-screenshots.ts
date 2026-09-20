/**
 * Captures the pricing checks listed in docs/pricing-audit.md against a running, seeded server:
 *   pnpm build && pnpm start:local   (in another terminal)
 *   pnpm exec tsx scripts/pricing-screenshots.ts
 * Writes PNGs into docs/pricing-audit/ and resets the demo data afterwards.
 */
import { chromium, type Page } from '@playwright/test';

const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000';
const OUT = 'docs/pricing-audit';

interface ProposalDTO {
  key: string;
  personId: string;
}

async function keys(page: Page): Promise<Record<string, string>> {
  const res = await page.request.get(`${BASE}/api/proposals`);
  const body = (await res.json()) as { today: ProposalDTO[] };
  return Object.fromEntries(body.today.map((p) => [p.personId, p.key]));
}

async function openEditor(page: Page, key: string, step: number): Promise<void> {
  await page.goto(`${BASE}/personalise/${encodeURIComponent(key)}?from=reminder`, {
    waitUntil: 'networkidle',
  });
  await page.getByTestId('editor').waitFor();
  if (step !== 1) await page.getByTestId(`step-${step}`).click();
  await page.waitForTimeout(500);
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.request.post(`${BASE}/api/demo/reset`);
  await page.goto(`${BASE}/reminders`, { waitUntil: 'networkidle' });
  const k = await keys(page);

  // 1. Sam Whitlock, Regular Classic, pick-up: total and the pick-up promise.
  await openEditor(page, k.person_sam as string, 5);
  await page.screenshot({ path: `${OUT}/01-sam-pickup.png` });

  // 2. Bill Ellis, Regular Signature, tracked.
  await openEditor(page, k.person_bill as string, 5);
  await page.screenshot({ path: `${OUT}/02-bill-tracked.png` });

  // 3. Dan Okafor, Regular Signature, advance with the Moonpig comparison.
  await openEditor(page, k.person_dan as string, 5);
  await page.screenshot({ path: `${OUT}/03-dan-advance.png` });

  // 4. Luxe removes pick-up (Sam).
  await openEditor(page, k.person_sam as string, 1);
  await page.getByTestId('finish-luxe').click();
  await page.waitForTimeout(600);
  await page.getByTestId('step-5').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/04-sam-luxe-no-pickup.png` });

  // 5. Large removes pick-up (Sam, back to Classic first).
  await page.getByTestId('step-1').click();
  await page.getByTestId('finish-classic').click();
  await page.waitForTimeout(400);
  await page.getByTestId('size-large').click();
  await page.waitForTimeout(600);
  await page.getByTestId('step-5').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/05-sam-large-no-pickup.png` });

  // 6. Giant forces tracked at the Giant tracked price (Dan).
  await openEditor(page, k.person_dan as string, 1);
  await page.getByTestId('size-giant').click();
  await page.waitForTimeout(600);
  await page.getByTestId('step-5').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/06-dan-giant-tracked.png` });

  // 7. Operations: blended contribution and break-even.
  await page.goto(`${BASE}/hq/operations`, { waitUntil: 'networkidle' });
  await page.getByTestId('break-even').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/07-operations-economics.png` });

  await page.request.post(`${BASE}/api/demo/reset`);
  await context.close();
  await browser.close();
  console.log('pricing screenshots written to', OUT);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
