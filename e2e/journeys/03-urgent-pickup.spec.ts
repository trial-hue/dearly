import { expect, test } from '@playwright/test';

import { openEditorFor, resetDemo } from '../helpers';
import { PRICES } from '../prices';

test.describe('journey 3: urgent card', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test("Sam's proposal offers pick-up at 1.95, total 4.94, no guarantee; Luxe removes pick-up", async ({
    page,
  }) => {
    await openEditorFor(page, 'person_sam');
    const editor = page.getByTestId('editor');
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
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularClassicPickup);
  });
});
