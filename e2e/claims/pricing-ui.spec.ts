import { expect, test } from '@playwright/test';

import { openEditorFor, resetDemo } from '../helpers';
import { PRICES } from '../prices';

test.describe('A. pricing on screen', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('A2 the full price including delivery is visible before every pay button', async ({
    page,
  }) => {
    // Proposal card.
    await page.goto('/reminders');
    const card = page.getByTestId('reminder-person_dan');
    await expect(card.getByTestId('reminder-total')).toHaveText(PRICES.regularSignatureAdvance);
    const totalBox = await card.getByTestId('reminder-total').boundingBox();
    const approveBox = await card.getByTestId('reminder-approve').boundingBox();
    expect(totalBox!.y).toBeLessThanOrEqual(approveBox!.y + approveBox!.height);
    // Product page, before Personalise.
    await page.goto('/card/bday-balloon-bunch');
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await expect(page.getByTestId('product-personalise')).toBeVisible();
    // Personalise bar, before Approve and pay.
    await openEditorFor(page, 'person_dan');
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await expect(page.getByTestId('sticky-bar')).toContainText('delivery included');
    await expect(page.getByTestId('approve')).toContainText(PRICES.regularSignatureAdvance);
    // eCard send.
    await page.getByTestId('ecard-toggle').check();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.ecard);
    await expect(page.getByTestId('approve')).toContainText(PRICES.ecard);
    await page.getByTestId('ecard-toggle').uncheck();
    // Basket, before Pay.
    await page.getByTestId('add-to-basket').click();
    await expect(page).toHaveURL(/\/basket/);
    await expect(page.getByTestId('basket-total')).toHaveText(PRICES.regularSignatureAdvance);
    await expect(page.getByTestId('basket-pay')).toContainText(PRICES.regularSignatureAdvance);
    // Business schedule, before Schedule.
    await page.goto('/business/send');
    await page.getByTestId('clean-rules').click();
    await expect(page.getByTestId('batch-pricing')).toContainText('Total ex VAT');
    await expect(page.getByTestId('batch-pricing')).toContainText(/£\d+\.\d\d/);
    await expect(page.getByTestId('schedule-all')).toBeVisible();
  });

  test('A3 size comes before finish, Regular and Signature are preselected, three finishes show prices, and every design has all three sizes', async ({
    page,
  }) => {
    for (const design of ['bday-balloon-bunch', 'bday-cake-stack', 'bday-confetti-pop']) {
      await page.goto(`/card/${design}`);
      const size = await page.getByTestId('size-regular').boundingBox();
      const finish = await page.getByTestId('finish-classic').boundingBox();
      expect(size!.y).toBeLessThan(finish!.y);
      await expect(page.getByTestId('size-regular')).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByTestId('finish-signature')).toHaveAttribute('aria-checked', 'true');
      for (const s of ['regular', 'large', 'giant'])
        await expect(page.getByTestId(`size-${s}`)).toBeEnabled();
      for (const f of ['classic', 'signature', 'luxe']) {
        await expect(page.getByTestId(`finish-${f}`)).toBeVisible();
        await expect(page.getByTestId(`finish-${f}`)).toContainText(/£\d\.\d\d/);
      }
    }
    // Same order and defaults in the editor.
    await openEditorFor(page, 'person_dan');
    const size = await page.getByTestId('size-regular').boundingBox();
    const finish = await page.getByTestId('finish-classic').boundingBox();
    expect(size!.y).toBeLessThan(finish!.y);
    await expect(page.getByTestId('size-regular')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('finish-signature')).toHaveAttribute('aria-checked', 'true');
  });

  test('A5 Giant always ships tracked at 3.99 and advance is never offered', async ({ page }) => {
    await openEditorFor(page, 'person_dan');
    await page.getByTestId('size-giant').click();
    await page.getByTestId('step-5').click();
    await expect(page.getByTestId('mode-tracked')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('mode-tracked')).toContainText(PRICES.giantTrackedDelivery);
    await expect(page.getByTestId('mode-advance')).toHaveCount(0);
    await expect(page.getByTestId('mode-pickup')).toHaveCount(0);
    await page.goto('/card/bday-balloon-bunch');
    await page.getByTestId('size-giant').click();
    await expect(page.getByTestId('delivery-promise')).toContainText(/Tracked/);
    await expect(page.getByTestId('delivery-promise')).not.toContainText(/advance/i);
  });

  test('A6 the Moonpig comparison appears only for printed Regular cards, uses 5.89 or 6.78, and hides on a negative saving', async ({
    page,
  }) => {
    await page.goto('/card/bday-balloon-bunch');
    await expect(page.getByTestId('moonpig-compare')).toContainText(PRICES.moonpigAdvance);
    await page.getByTestId('finish-luxe').click();
    await expect(page.getByTestId('moonpig-compare')).toHaveCount(0);
    await page.getByTestId('finish-signature').click();
    await page.getByTestId('size-large').click();
    await expect(page.getByTestId('moonpig-compare')).toHaveCount(0);
    await page.getByTestId('size-regular').click();
    await page.getByTestId('product-ecard').check();
    await expect(page.getByTestId('moonpig-compare')).toHaveCount(0);
    // Tracked compares against 6.78.
    await openEditorFor(page, 'person_bill');
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureTracked);
    await expect(page.getByTestId('moonpig-compare')).toContainText('£6.78');
  });

  test('A7 the digital copy adds 0.29 to a printed card, the eCard is 0.79, and both unlock narration, animation, drawing and clip', async ({
    page,
  }) => {
    await openEditorFor(page, 'person_dan');
    await page.getByTestId('step-4').click();
    await expect(page.getByTestId('record-narration')).toHaveCount(0);
    await page.getByTestId('digital-copy').check();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvanceDigital);
    await expect(page.getByTestId('record-narration')).toBeVisible();
    await expect(page.getByTestId('builtin-voice')).toBeVisible();
    await expect(page.getByTestId('extras')).toContainText(/animation/i);
    await expect(page.getByTestId('extras')).toContainText(/clip/i);
    await expect(page.getByTestId('extras')).toContainText(/draw/i);
    await page.getByTestId('digital-copy').uncheck();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await page.getByTestId('ecard-toggle').check();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.ecard);
    await page.getByTestId('step-4').click();
    await expect(page.getByTestId('record-narration')).toBeVisible();
    await expect(page.getByTestId('digital-copy')).toHaveCount(0);
  });

  test('A9 Operations shows blended 2.07, break-even about 159,000, team cost per order, and every cost edit updates all nine cells and the break-even', async ({
    page,
  }) => {
    await page.goto('/hq/operations');
    await expect(page.getByTestId('blended')).toHaveText('£2.07');
    await expect(page.getByTestId('break-even')).toHaveText('159,107');
    // Team cost per order = team cost / annual orders (5,000 customers × 4).
    await expect(page.getByTestId('team-cost-order')).toHaveText('£16.50');
    const cells = page.getByTestId('contribution-table').getByTestId('contribution');
    await expect(cells).toHaveCount(9);
    const before = await cells.allTextContents();
    expect(before[1]).toBe('£1.93');
    await page.getByLabel('Guarantee £ per order').fill('0.5');
    await expect(page.getByTestId('break-even')).not.toHaveText('159,107');
    await expect
      .poll(async () => (await cells.allTextContents()).filter((c, i) => c !== before[i]).length)
      .toBe(9);
    await page.getByLabel('Guarantee £ per order').fill('0.1');
    await expect(page.getByTestId('break-even')).toHaveText('159,107');
  });
});
