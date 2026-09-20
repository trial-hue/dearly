import { expect, type Page } from '@playwright/test';

/** Reset the demo database so every scenario starts from the seeded state. */
export async function resetDemo(page: Page): Promise<void> {
  const res = await page.request.post('/api/demo/reset');
  expect(res.ok()).toBeTruthy();
  await page
    .evaluate(() => {
      try {
        localStorage.removeItem('dearly-basket');
      } catch {
        // storage unavailable
      }
    })
    .catch(() => undefined);
}

export async function expectToast(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByTestId('toast')).toContainText(text);
}

/** The demo levers on Orders live in a collapsed drawer. */
export async function openDemoControls(page: Page): Promise<void> {
  const controls = page.getByTestId('demo-controls');
  const isOpen = await controls.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!isOpen) await page.getByTestId('demo-toggle').click();
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
    await openDemoControls(page);
    await page.getByTestId('run-next-step').click();
    await expectToast(page, 'moved one step');
    await page.waitForTimeout(300);
  }
  await expect(page.getByTestId(orderTestId).getByTestId('stage-current')).toHaveText(stageText);
}
