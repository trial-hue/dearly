import { expect, test } from '@playwright/test';

import { resetDemo } from '../helpers';

test.describe('journey 7: florist @noai', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('read the sample order, confirm, see the free first card and the ledger', async ({
    page,
  }) => {
    await page.goto('/hq/partners');
    await expect(page.getByTestId('referrals')).toContainText(/No referrals yet/);
    await page.getByTestId('read-order').click();
    const reading = page.getByTestId('florist-reading');
    await expect(reading).toContainText('Mrs J Sharma');
    await expect(reading).toContainText('mother');
    await expect(reading).toContainText(/birthday/i);
    await expect(reading).toContainText('70');
    // Nothing is saved until the customer confirms.
    await expect(page.getByTestId('referrals')).toContainText(/No referrals yet/);
    await page.getByTestId('claim-referral').click();
    const referrals = page.getByTestId('referrals');
    await expect(referrals).toContainText('Mrs J Sharma');
    await expect(referrals).toContainText('first card free');
    await expect(referrals).toContainText('£1.50');
    await expect(referrals).toContainText('£2.45');
  });
});
