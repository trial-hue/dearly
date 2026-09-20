import { expect, test } from '@playwright/test';

import { resetDemo, runNextStepUntil } from './helpers';

test.describe('core flow', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('proposal to delivered card, recipient rating, inventory and printer score', async ({
    page,
  }) => {
    await page.goto('/today');
    const ready = page.getByTestId('ready-list');
    await expect(ready).toBeVisible();
    expect(await ready.locator('[data-testid^="reminder-person_"]').count()).toBeGreaterThanOrEqual(
      4,
    );
    await expect(page.getByTestId('reminder-person_peter')).toHaveCount(0);
    await expect(page.getByTestId('reminder-person_bill')).toContainText('Tracked');
    await expect(page.getByTestId('reminder-person_sam')).toContainText('Pick-up');
    await expect(page.getByTestId('reminder-person_priya')).toContainText(/address/i);

    // Edit Dan's card: Large changes the price at once.
    await page.getByTestId('reminder-person_dan').getByTestId('reminder-edit').click();
    const editor = page.getByTestId('editor');
    await expect(editor).toBeVisible();
    await expect(page.getByTestId('price-total')).toHaveText('£4.94');
    await expect(page.getByTestId('moonpig-compare')).toContainText('£5.89');
    await editor.getByTestId('size-large').click();
    await expect(page.getByTestId('price-total')).not.toHaveText('£4.94');
    await editor.getByTestId('size-regular').click();
    await expect(page.getByTestId('price-total')).toHaveText('£4.94');
    await editor.getByTestId('size-giant').click();
    await page.getByTestId('step-5').click();
    await expect(editor.getByTestId('mode-tracked')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('step-1').click();
    await editor.getByTestId('size-regular').click();
    await expect(page.getByTestId('price-total')).toHaveText('£4.94');
    await page.getByTestId('approve').click();

    // Orders: run the next step until delivered.
    await expect(page).toHaveURL(/\/orders/);
    const order = page
      .getByTestId('orders-list')
      .locator('[data-testid^="order-"]')
      .filter({ hasText: 'Dan Okafor' })
      .filter({ hasText: /birthday/i })
      .first();
    await expect(order).toBeVisible();
    const orderId = (await order.getAttribute('data-testid')) as string;
    await runNextStepUntil(page, orderId, 'Delivered');

    // Recipient page: rate five stars, save, send one back.
    await page.getByTestId(orderId).getByTestId('open-recipient').click();
    await expect(page.getByTestId('recipient-view')).toBeVisible();
    await page.getByTestId('star-5').click();
    await expect(page.getByTestId('star-5')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('save-to-dearly').click();
    await expect(page.getByTestId('save-to-dearly')).toContainText(/Saved/);
    await page.getByTestId('send-one-back').click();
    await expect(page.getByTestId('send-one-back')).toContainText(/proposed|Reminders/);

    // My cards shows the card twice (sent and saved); download is a valid SVG.
    await page.goto('/inventory');
    const items = page.locator('[data-testid^="mycard-"]').filter({ hasText: 'Dan Okafor' });
    expect(await items.count()).toBeGreaterThanOrEqual(2);
    const href = await items.first().getByTestId('download-card').getAttribute('href');
    const svg = await page.request.get(href as string);
    expect(svg.ok()).toBeTruthy();
    expect(svg.headers()['content-type']).toContain('image/svg+xml');
    expect(await svg.text()).toContain('<svg');

    // Operations: the printer score moved and a recipient joined.
    await page.goto('/operations');
    await expect(page.getByTestId('printer-mcr').getByTestId('printer-score')).toContainText(
      '4.82',
    );
    await expect(page.getByTestId('counters')).toContainText('Recipients joined');
    await expect(page.getByTestId('decisions')).toContainText('no acquisition cost');
  });
});
