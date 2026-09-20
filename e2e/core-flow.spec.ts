import { expect, test } from '@playwright/test';

import { resetDemo, runNextStepUntil } from './helpers';
import { PRICES } from './prices';

test.describe('core flow', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('proposal to delivered card, recipient rating, inventory and printer score', async ({
    page,
  }) => {
    await page.goto('/reminders');
    const ready = page.getByTestId('ready-list');
    await expect(ready).toBeVisible();
    expect(await ready.locator('[data-testid^="reminder-person_"]').count()).toBeGreaterThanOrEqual(
      4,
    );
    await expect(page.getByTestId('reminder-person_peter')).toHaveCount(0);
    await expect(page.getByTestId('reminder-person_bill')).toContainText('Arrives by');
    await expect(page.getByTestId('reminder-person_bill')).toContainText(
      PRICES.regularSignatureTracked,
    );
    await expect(page.getByTestId('reminder-person_sam')).toContainText(PRICES.pickupPromise);
    await expect(page.getByTestId('reminder-person_sam')).toContainText(
      PRICES.regularClassicPickup,
    );
    await expect(page.getByTestId('reminder-person_priya')).toContainText(/address/i);
    // The delivery rule: Bill (3 days) is tracked, Sam (tomorrow) is a pick-up.
    const screen = (await (await page.request.get('/api/proposals')).json()) as {
      today: { personId: string; card: { mode: string } }[];
    };
    expect(screen.today.find((p) => p.personId === 'person_bill')?.card.mode).toBe('tracked');
    expect(screen.today.find((p) => p.personId === 'person_sam')?.card.mode).toBe('pickup');

    // Edit Dan's card: Large changes the price at once.
    await page.getByTestId('reminder-person_dan').getByTestId('reminder-edit').click();
    const editor = page.getByTestId('editor');
    await expect(editor).toBeVisible();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await expect(page.getByTestId('moonpig-compare')).toContainText(
      `Moonpig ${PRICES.moonpigAdvance}, you save ${PRICES.moonpigSavingSignatureAdvance}`,
    );
    await editor.getByTestId('size-large').click();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.largeSignatureAdvance);
    await expect(page.getByTestId('moonpig-compare')).toHaveCount(0);
    await editor.getByTestId('size-regular').click();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    // Giant forces tracked at the Giant tracked price; advance is never offered.
    await editor.getByTestId('size-giant').click();
    await page.getByTestId('step-5').click();
    await expect(editor.getByTestId('mode-tracked')).toHaveAttribute('aria-checked', 'true');
    await expect(editor.getByTestId('mode-tracked')).toContainText(PRICES.giantTrackedDelivery);
    await expect(editor.getByTestId('mode-advance')).toHaveCount(0);
    await expect(editor.getByTestId('mode-pickup')).toHaveCount(0);
    await page.getByTestId('step-1').click();
    await editor.getByTestId('size-regular').click();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await page.getByTestId('approve').click();

    // Orders: run the next step until delivered.
    await expect(page).toHaveURL(/\/orders/);
    const order = page
      .getByTestId('orders-list')
      .locator('[data-testid^="order-"]')
      .filter({ hasText: /Dan/ })
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
    await page.goto('/my-cards?tab=sent');
    await page.goto('/my-cards');
    const items = page.locator('[data-testid^="mycard-"]').filter({ hasText: /Dan/ });
    expect(await items.count()).toBeGreaterThanOrEqual(2);
    const href = await items.first().getByTestId('download-card').getAttribute('href');
    const svg = await page.request.get(href as string);
    expect(svg.ok()).toBeTruthy();
    expect(svg.headers()['content-type']).toContain('image/svg+xml');
    expect(await svg.text()).toContain('<svg');

    // Operations: the printer score moved and a recipient joined.
    await page.goto('/hq/operations');
    await expect(page.getByTestId('printer-mcr').getByTestId('printer-score')).toContainText(
      '4.82',
    );
    await expect(page.getByTestId('counters')).toContainText('Recipients joined');
    await expect(page.getByTestId('decisions')).toContainText('no acquisition cost');
  });

  test('an urgent card offers pick-up at the pick-up price with no guarantee, and Luxe removes it', async ({
    page,
  }) => {
    await page.goto('/reminders');
    await page.getByTestId('reminder-person_sam').getByTestId('reminder-edit').click();
    const editor = page.getByTestId('editor');
    await expect(editor).toBeVisible();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularClassicPickup);
    await expect(page.getByTestId('moonpig-compare')).toContainText('no same-day physical card');
    await page.getByTestId('step-5').click();
    const pickup = editor.getByTestId('mode-pickup');
    await expect(pickup).toHaveAttribute('aria-checked', 'true');
    await expect(pickup).toContainText(PRICES.pickupDelivery);
    await expect(pickup).not.toContainText(/free/i);
    await expect(editor.getByTestId('mode-pickup-promise')).toContainText(PRICES.pickupPromise);
    await expect(editor.getByTestId('mode-pickup-promise')).not.toContainText(/arrives/i);
    await expect(editor.getByTestId('guarantee-badge')).toHaveCount(0);
    await expect(editor.getByTestId('no-guarantee')).toBeVisible();

    // Luxe is never picked up: the mode falls back to tracked and the tile disappears.
    await page.getByTestId('step-1').click();
    await editor.getByTestId('finish-luxe').click();
    await page.getByTestId('step-5').click();
    await expect(editor.getByTestId('mode-pickup')).toHaveCount(0);
    await expect(editor.getByTestId('mode-tracked')).toHaveAttribute('aria-checked', 'true');
    await expect(editor.getByTestId('guarantee-badge')).toBeVisible();
    await page.getByTestId('step-1').click();
    await editor.getByTestId('finish-classic').click();
    await page.getByTestId('step-5').click();
    await expect(editor.getByTestId('mode-pickup')).toHaveAttribute('aria-checked', 'true');
  });
});
