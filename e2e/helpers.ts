import { expect, type Page } from '@playwright/test';

/** Reset the demo database so every scenario starts from the seeded state. */
export async function resetDemo(page: Page): Promise<void> {
  const res = await page.request.post('/api/demo/reset');
  expect(res.ok()).toBeTruthy();
}

export async function expectToast(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByTestId('toast')).toContainText(text);
}

export async function runNextStepUntil(
  page: Page,
  orderTestId: string,
  stageText: string,
  maxSteps = 8,
): Promise<void> {
  for (let i = 0; i < maxSteps; i++) {
    const current = page.getByTestId(orderTestId).getByTestId('stage-current');
    if ((await current.textContent())?.trim() === stageText) return;
    await page.getByTestId('run-next-step').click();
    await expectToast(page, 'moved one step');
    await page.waitForTimeout(300);
  }
  await expect(page.getByTestId(orderTestId).getByTestId('stage-current')).toHaveText(stageText);
}
