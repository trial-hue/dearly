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

/** The AI status label the header should show for the provider the server was started with. */
export function expectedAiLabel(): 'Mock AI' | 'Built-in rules' {
  return (process.env.E2E_AI_PROVIDER ?? 'mock') === 'mock' ? 'Mock AI' : 'Built-in rules';
}

/** Open the personalise editor for a seeded person's proposal, from Reminders. */
export async function openEditorFor(page: Page, personId: string): Promise<void> {
  await page.goto('/reminders');
  await page.getByTestId(`reminder-${personId}`).getByTestId('reminder-edit').click();
  await expect(page.getByTestId('editor')).toBeVisible();
}

/** Proposal keys by person, from the API. */
export async function proposalKeys(page: Page): Promise<Record<string, string>> {
  const body = (await (await page.request.get('/api/proposals')).json()) as {
    today: { personId: string; key: string }[];
  };
  return Object.fromEntries(body.today.map((p) => [p.personId, p.key]));
}

/** The full rendered text of the page, as a viewer sees it (hidden and closed content excluded). */
export async function visibleText(page: Page): Promise<string> {
  return page.locator('body').innerText();
}
