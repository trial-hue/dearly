import { expect, test } from '@playwright/test';

import { expectToast, openDemoControls, resetDemo, runNextStepUntil } from '../helpers';
import { PRICES } from '../prices';

test.describe('journey 4: recovery', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('an order advanced to posted, then delayed, gets all four recovery actions, on the order and in the decision log', async ({
    page,
  }) => {
    await page.goto('/reminders');
    await page.getByTestId('reminder-person_dan').getByTestId('reminder-approve').click();
    await expectToast(page, /Approved/);
    await page.goto('/orders');
    const order = page
      .getByTestId('orders-list')
      .locator('[data-testid^="order-"]')
      .filter({ hasText: /Dan/ })
      .filter({ hasText: /birthday/i })
      .first();
    const orderId = (await order.getAttribute('data-testid')) as string;
    await runNextStepUntil(page, orderId, 'Posted');
    await openDemoControls(page);
    await page
      .locator(`[data-testid="delay"][data-order="${orderId.replace('order-', '')}"]`)
      .click();
    const recovery = page.getByTestId(orderId).getByTestId('recovery');
    await expect(recovery).toBeVisible();
    await expect(recovery).toContainText('On-the-day eCard');
    await expect(recovery).toContainText('Full refund');
    await expect(recovery).toContainText(PRICES.regularSignatureAdvance);
    await expect(recovery).toContainText('50% off the card price of the next order');
    await expect(recovery).toContainText(/single-use/i);
    await expect(recovery).toContainText('Tracked reprint');
    await page.goto('/hq/operations');
    const decisions = page.getByTestId('decisions');
    await expect(decisions).toContainText(`Refunded ${PRICES.regularSignatureAdvance}`);
    await expect(decisions).toContainText('Tracked reprint');
    await expect(decisions).toContainText('eCard scheduled');
    await expect(decisions).toContainText('50% next-card code');
  });
});
