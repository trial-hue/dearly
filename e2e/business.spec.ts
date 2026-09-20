import { expect, test } from '@playwright/test';

import { expectToast, resetDemo } from './helpers';

test.describe('business sends', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('clean the staff list, schedule an office drop, see the batch on Operations', async ({
    page,
  }) => {
    await page.goto('/business');
    await page.getByTestId('option-officeDrop').click();
    await page.getByTestId('clean-rules').click();
    await expect(page.getByTestId('staff-rows')).toContainText('8 ready, 2 flagged');
    await expect(page.getByTestId('batch-pricing')).toContainText('Total ex VAT');
    await page.getByTestId('schedule-all').click();
    await expectToast(page, 'Scheduled 8 cards');
    await expect(page.getByTestId('batches')).toContainText('Office drop');
    await page.goto('/operations');
    await expect(page.getByTestId('ops-batch').first()).toContainText('8 cards by office drop');
    await expect(page.getByTestId('ops-batch').first()).toContainText('contribution');
  });
});
