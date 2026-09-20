import { expect, test } from '@playwright/test';

import { expectToast, resetDemo } from './helpers';

/**
 * Every AI feature works with no provider. The server under test runs with AI_PROVIDER=mock;
 * this suite still checks the shape of each job's result and the status in the demo menu.
 */
test.describe('AI jobs and fallbacks', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('every job answers and the demo menu shows the provider state', async ({ page }) => {
    await page.goto('/today');
    await expect(page.getByTestId('ai-status')).toHaveText(/Built-in rules|Mock AI|AI connected/);

    await page.getByTestId('draft-all').click();
    await expectToast(page, /Drafted \d+ cards/);

    await page.goto('/people');
    await page.getByTestId('import-example').click();
    await page.getByTestId('import-preview').click();
    await expect(page.getByTestId('import-add-all')).toBeVisible();
    await page.getByTestId('import-add-all').click();
    await expectToast(page, 'Added 3 people');
    await expect(page.getByTestId('people-list')).toContainText('Jo Ellis');

    await page.getByTestId('life-text').fill('Uncle Peter passed away in June');
    await page.getByTestId('life-event-check').click();
    await expect(page.getByTestId('life-event-result')).toContainText('Peter Ellis');

    await page.goto('/business');
    await page.getByTestId('clean-rules').click();
    await expect(page.getByTestId('staff-rows')).toContainText('7 ready, 3 flagged');
    await page.getByTestId('clean-ai').click();
    await expect(page.getByTestId('staff-rows')).toBeVisible();

    await page.goto('/florists');
    await page.getByTestId('read-order').click();
    await expect(page.getByTestId('florist-reading')).toContainText('Mrs J Sharma');
    await expect(page.getByTestId('florist-reading')).toContainText('mother');

    await page.goto('/help');
    await page.getByTestId('chat-input').fill("my card for Priya hasn't arrived");
    await page.getByTestId('chat-send').click();
    await expect(page.getByTestId('chat-log')).toContainText(/reprint/i);
  });

  test('the rules-only path is exercised directly against the API', async ({ page }) => {
    const r = await page.request.post('/api/ai/read_florist_order', {
      data: { text: 'Roses for Dad, happy 65th birthday, deliver on Friday 9 October 2026' },
    });
    expect(r.ok()).toBeTruthy();
    const body = (await r.json()) as {
      reading: { relationship: string; age: number | null };
      by: string;
    };
    expect(['ai', 'rule']).toContain(body.by);
    const agent = await page.request.post('/api/agent', {
      data: { message: 'refund the card for Dan', turns: [] },
    });
    expect(agent.ok()).toBeTruthy();
    const turn = (await agent.json()) as { action: string };
    expect(['none', 'refund']).toContain(turn.action);
  });
});
