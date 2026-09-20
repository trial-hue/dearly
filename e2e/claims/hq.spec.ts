import { expect, test } from '@playwright/test';

import { expectedAiLabel, resetDemo } from '../helpers';

test.describe('G. HQ and the operating model @noai', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('G1 the header status matches the configured provider on HQ and in the storefront demo menu', async ({
    page,
  }) => {
    await page.goto('/hq/operations');
    await expect(page.getByTestId('ai-status')).toHaveText(expectedAiLabel());
    await page.goto('/');
    await page
      .locator('details', { hasText: 'Demo' })
      .evaluate((el) => ((el as HTMLDetailsElement).open = true));
    await expect(page.getByTestId('ai-status')).toHaveText(expectedAiLabel());
  });

  test("G8 Operations shows the thesis table with Moonpig's figures, the three Dearly roles and the footnote on sources", async ({
    page,
  }) => {
    await page.goto('/hq/operations');
    const thesis = page.getByTestId('thesis');
    for (const s of [
      '12.3m customers',
      '36.0m orders',
      '£38.7m',
      '242 data',
      '9am to 5:30pm',
      '250 to 300gsm',
    ])
      await expect(thesis).toContainText(s);
    for (const role of ['Product and AI', 'Operations and partners', 'Growth and care'])
      await expect(page.locator('body')).toContainText(new RegExp(role, 'i'));
    await expect(page.getByTestId('thesis-footnote')).toContainText(/source/i);
    await expect(page.getByTestId('thesis-footnote')).toContainText(/annual report|FY2/i);
  });
});
