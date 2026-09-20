import { expect, test } from '@playwright/test';

import { expectToast, resetDemo } from './helpers';
import { PRICES } from './prices';

test.describe('browse to order', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('a first-time viewer goes Home, Birthday, a design, options, Personalise, Basket, pay, Orders', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('hero-cta')).toBeVisible();
    await page.getByTestId('occasion-tile-birthday').click();
    await expect(page).toHaveURL(/\/cards\/birthday/);
    await expect(page.getByTestId('result-count')).toContainText(/\d+ cards/);
    await page.getByTestId('product-tile-bday-cake-stack').click();
    await expect(page).toHaveURL(/\/card\/bday-cake-stack/);

    // Options reprice at once; the total includes delivery before any pay button.
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await page.getByTestId('size-large').click();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.largeSignatureAdvance);
    await page.getByTestId('finish-luxe').click();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.largeLuxeAdvance);
    await page.getByTestId('size-regular').click();
    // Regular Luxe costs more than Moonpig, so the comparison is hidden.
    await expect(page.getByTestId('moonpig-compare')).toHaveCount(0);
    await page.getByTestId('finish-signature').click();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await expect(page.getByTestId('moonpig-compare')).toContainText(PRICES.moonpigAdvance);
    await expect(page.getByTestId('moonpig-compare')).toContainText(
      PRICES.moonpigSavingSignatureAdvance,
    );

    await page.getByTestId('product-personalise').click();
    await expect(page.getByTestId('recipient-dialog')).toBeVisible();
    await page.getByTestId('recipient-select').selectOption('person_dan');
    await page.getByTestId('recipient-continue').click();

    await expect(page).toHaveURL(/\/personalise\//);
    await expect(page.getByTestId('editor')).toBeVisible();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);

    // The customer chooses the date; the delivery rule and the price follow it.
    const iso = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    await page.getByTestId('step-5').click();
    await page.getByTestId('occasion-date').fill(iso(2));
    await expect(page.getByTestId('mode-tracked')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureTracked);
    await page.getByTestId('occasion-date').fill(iso(20));
    await expect(page.getByTestId('mode-advance')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvance);
    await page.getByTestId('add-to-basket').click();

    await expect(page).toHaveURL(/\/basket/);
    await expect(
      page.getByTestId('basket-items').locator('[data-testid^="basket-item-"]'),
    ).toHaveCount(1);
    await expect(page.getByTestId('basket-total')).toHaveText(PRICES.regularSignatureAdvance);
    await expect(page.getByTestId('guarantee-badge').first()).toBeVisible();
    await page.getByTestId('basket-pay').click();
    await expectToast(page, 'Paid');
    await expect(page).toHaveURL(/\/orders/);
    await expect(page.getByTestId('orders-list')).toContainText('Dan');
    await expect(page.getByTestId('basket-count')).toHaveCount(0);
  });
});
