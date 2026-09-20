import { expect, test } from '@playwright/test';

import { resetDemo, runNextStepUntil } from './helpers';

test.describe('core flow', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('proposal to delivered card, recipient rating, inventory and printer score', async ({
    page,
  }) => {
    await page.goto('/today');
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    const proposals = page.getByTestId('today-list').locator('article');
    expect(await proposals.count()).toBeGreaterThanOrEqual(4);
    await expect(page.getByTestId('proposal-person_peter')).toHaveCount(0);
    await expect(page.getByTestId('proposal-person_bill')).toContainText('Tracked');
    await expect(page.getByTestId('proposal-person_sam')).toContainText('Pick-up');
    await expect(page.getByTestId('proposal-person_priya')).toContainText(
      'Address last checked over a year ago',
    );

    // Edit Dan's card: Large changes the price at once.
    await page.getByTestId('proposal-person_dan').getByRole('link', { name: 'Edit' }).click();
    const editor = page.getByTestId('card-editor');
    await expect(editor).toBeVisible();
    await expect(editor.getByTestId('price-total')).toHaveText('£4.94');
    await expect(editor.getByTestId('moonpig-compare')).toContainText('£5.89');
    await editor.getByRole('button', { name: /^Large/ }).click();
    await expect(editor.getByTestId('price-total')).not.toHaveText('£4.94');
    await editor.getByRole('button', { name: /^Regular/ }).click();
    await expect(editor.getByTestId('price-total')).toHaveText('£4.94');
    await editor.getByRole('button', { name: /^Giant/ }).click();
    await expect(editor.getByRole('radio', { name: /^Tracked/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await editor.getByRole('button', { name: /^Regular/ }).click();
    await editor.getByTestId('approve').click();

    // Orders: run the next step until delivered.
    await expect(page).toHaveURL(/\/orders/);
    const order = page
      .getByTestId('orders-list')
      .locator('article')
      .filter({ hasText: 'Dan Okafor' })
      .filter({ hasText: 'Happy birthday' })
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
    await expect(page.getByTestId('save-to-dearly')).toHaveText('Saved to your Dearly');
    await page.getByTestId('send-one-back').click();
    await expect(page.getByTestId('send-one-back')).toContainText('proposed on Today');

    // Inventory shows the card twice (sent and saved); download is a valid SVG.
    await page.goto('/inventory');
    const items = page.locator('[data-testid^="inventory-"]').filter({ hasText: 'Dan Okafor' });
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
