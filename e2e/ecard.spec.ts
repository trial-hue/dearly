import { expect, test } from '@playwright/test';

import { resetDemo } from './helpers';

test.describe('eCards', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('an eCard is chosen from the eCards page, personalised with narration and sent by link', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('home-ecards').click();
    await expect(page).toHaveURL(/\/ecards/);
    await page.getByTestId('product-tile-bday-confetti-pop').click();
    await expect(page).toHaveURL(/\/card\/bday-confetti-pop\?ecard=1/);
    await expect(page.getByTestId('product-ecard')).toBeChecked();
    await expect(page.getByTestId('price-total')).toHaveText('£0.79');

    await page.getByTestId('product-personalise').click();
    await page.getByTestId('recipient-select').selectOption('person_dan');
    await page.getByTestId('recipient-continue').click();

    await expect(page.getByTestId('editor')).toBeVisible();
    await expect(page.getByTestId('ecard-toggle')).toBeChecked();
    await expect(page.getByTestId('price-total')).toHaveText('£0.79');
    await page.getByTestId('step-4').click();
    await page.getByTestId('builtin-voice').click();
    await page.getByTestId('approve').click();
    await expect(page).toHaveURL(/\/orders/);
    await expect(page.getByTestId('orders-list')).toContainText('eCard');
    await expect(page.getByTestId('orders-list')).toContainText('Dan');
  });
});
