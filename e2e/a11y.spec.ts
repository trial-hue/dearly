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

  test('Home, Browse, Product, Personalise, Reminders and the recipient page have no serious or critical issues', async ({
    page,
  }) => {
    for (const url of ['/', '/cards/birthday', '/card/bday-balloon-bunch']) {
      await page.goto(url);
      expect(serious((await new AxeBuilder({ page }).analyze()).violations), url).toEqual([]);
    }
    await page.goto('/reminders');
    await expect(page.getByTestId('ready-list')).toBeVisible();
    expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    await page.getByTestId('reminder-person_dan').getByTestId('reminder-edit').click();
    await expect(page.getByTestId('editor')).toBeVisible();
    expect(
      serious(
        (await new AxeBuilder({ page }).include('[data-testid="editor"]').analyze()).violations,
      ),
    ).toEqual([]);

    await page.goto('/r/seed-dan-birthday-delivered-2025');
    await expect(page.getByTestId('recipient-view')).toBeVisible();
    expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
  });
});
