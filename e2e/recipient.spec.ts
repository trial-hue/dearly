import { expect, test } from '@playwright/test';

import { resetDemo } from './helpers';

test.describe('recovery', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('a delayed posted order shows the eCard, refund, discount code and reprint', async ({
    page,
  }) => {
    await page.goto('/orders');
    const order = page.getByTestId('order-ord_seed_priya');
    await expect(order).toContainText('Posted');
    await order.getByTestId('delay').click();
    const recovery = order.getByTestId('recovery');
    await expect(recovery).toBeVisible();
    await expect(recovery).toContainText('On-the-day eCard');
    await expect(recovery).toContainText('Full refund');
    await expect(recovery).toContainText('50% off the next card');
    await expect(recovery).toContainText('Tracked reprint');
    await page.goto('/operations');
    const decisions = page.getByTestId('decisions');
    await expect(decisions).toContainText('Refunded');
    await expect(decisions).toContainText('Tracked reprint');
    await expect(decisions).toContainText('eCard scheduled');
    await expect(decisions).toContainText('50% next-card code');
  });

  test('the recipient page and its card download work from the QR link', async ({ page }) => {
    await page.goto('/r/seed-dan-birthday-delivered-2025');
    await expect(page.getByTestId('recipient-view')).toContainText('Dan');
    const svg = await page.request.get('/r/seed-dan-birthday-delivered-2025/card.svg');
    expect(svg.ok()).toBeTruthy();
    expect(await svg.text()).toContain('viewBox="0 0 264 370"');
    const missing = await page.request.get('/r/not-a-real-slug-at-all');
    expect(missing.status()).toBe(404);
  });
});
