import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { resetDemo } from './helpers';

type Violation = { id: string; impact?: string | null; nodes: { target: unknown[] }[] };

/** Serious and critical violations as readable strings, so a failure names the rule and element. */
function serious(violations: Violation[]): string[] {
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('accessibility smoke', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('Today, the editor and the recipient page have no serious or critical issues', async ({
    page,
  }) => {
    await page.goto('/today');
    await expect(page.getByTestId('today-list')).toBeVisible();
    expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    await page.getByTestId('proposal-person_dan').getByRole('link', { name: 'Edit' }).click();
    await expect(page.getByTestId('card-editor')).toBeVisible();
    expect(
      serious(
        (await new AxeBuilder({ page }).include('[data-testid="card-editor"]').analyze())
          .violations,
      ),
    ).toEqual([]);

    await page.goto('/r/seed-dan-birthday-delivered-2025');
    await expect(page.getByTestId('recipient-view')).toBeVisible();
    expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
  });
});
