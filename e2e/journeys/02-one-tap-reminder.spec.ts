import { expect, test } from '@playwright/test';

import { expectToast, resetDemo } from '../helpers';
import { PRICES } from '../prices';

test.describe('journey 2: one-tap reminder @noai', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test("Dan's proposal is approved from Home in one tap at 4.94 and the order is created", async ({
    page,
  }) => {
    await page.goto('/');
    const card = page.getByTestId('reminder-person_dan').first();
    await expect(card).toBeVisible();
    // A2: the full price, delivery included, sits on the card before the pay button.
    await expect(card.getByTestId('reminder-total')).toHaveText(PRICES.regularSignatureAdvance);
    await expect(card.getByTestId('reminder-approve')).toContainText(
      PRICES.regularSignatureAdvance,
    );
    await card.getByTestId('reminder-approve').click();
    await expectToast(page, /Approved/);
    await page.goto('/orders');
    const order = page
      .getByTestId('orders-list')
      .locator('[data-testid^="order-"]')
      .filter({ hasText: /Dan/ })
      .filter({ hasText: /birthday/i })
      .first();
    await expect(order).toBeVisible();
    await expect(order).toContainText(PRICES.regularSignatureAdvance);
    await page.goto('/reminders');
    await expect(page.getByTestId('reminder-person_dan')).toHaveCount(0);
  });
});
