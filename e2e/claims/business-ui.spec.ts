import { expect, test } from '@playwright/test';

import { resetDemo } from '../helpers';
import { PRICES } from '../prices';

test.describe('E. business on screen', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('E2, E4 and E6: the prices, the 3.60 comparison and the ex-VAT wording', async ({
    page,
  }) => {
    await page.goto('/business/pricing');
    const prices = page.getByTestId('business-prices');
    await expect(prices).toContainText(PRICES.businessPosted);
    await expect(prices).toContainText(`${PRICES.businessTier250} from 250`);
    await expect(prices).toContainText(`${PRICES.businessTier2000} from 2,000`);
    await expect(prices).toContainText(PRICES.businessOfficeDrop);
    await expect(prices).toContainText(`${PRICES.automateMonthly} a month`);
    await expect(prices).toContainText('25 cards included');
    await expect(page.locator('body')).toContainText(/ex VAT|excluding VAT/);
    const calc = page.getByTestId('calculator');
    await expect(calc).toContainText(PRICES.moonpigBusiness);
    await expect(calc).toContainText(/sav/i);
    await expect(calc).toContainText(/ex VAT|excluding VAT/);
    await page.goto('/business/send');
    await page.getByTestId('clean-rules').click();
    await expect(page.getByTestId('batch-pricing')).toContainText(/ex VAT/);
    await expect(page.locator('#biz-finish option')).toHaveCount(2);
    await expect(page.locator('#biz-finish')).not.toContainText('Luxe');
  });
});
