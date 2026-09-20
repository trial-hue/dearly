import { expect, test } from '@playwright/test';

import { resetDemo } from '../helpers';

test.describe('journey 9: life event', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('a bereavement is read, the pause is confirmed, and no proposal or print follows', async ({
    page,
  }) => {
    await page.goto('/reminders');
    await expect(page.getByTestId('reminder-person_bill')).toBeVisible();
    await page.goto('/reminders?tab=people');
    await page.getByTestId('life-open').click();
    await page.getByTestId('life-text').fill('Grandad Bill passed away last week');
    await page.getByTestId('life-event-check').click();
    const result = page.getByTestId('life-event-result');
    await expect(result).toContainText('Bill Ellis');
    // G5: nothing changes until the customer confirms.
    const before = (await (await page.request.get('/api/people')).json()) as {
      id: string;
      pausedReason: string | null;
    }[];
    expect(before.find((p) => p.id === 'person_bill')?.pausedReason).toBeNull();
    await page.getByTestId('life-confirm').click();
    await expect(page.getByTestId('life-event-result')).toContainText(/paused/i);
    const after = (await (await page.request.get('/api/people')).json()) as {
      id: string;
      pausedReason: string | null;
    }[];
    expect(after.find((p) => p.id === 'person_bill')?.pausedReason).toBeTruthy();

    // No proposal, no print.
    await page.goto('/reminders');
    await expect(page.getByTestId('reminder-person_bill')).toHaveCount(0);
    const proposals = (await (await page.request.get('/api/proposals')).json()) as {
      today: { personId: string }[];
    };
    expect(proposals.today.some((p) => p.personId === 'person_bill')).toBe(false);
    const r = await page.request.patch('/api/proposals/person_bill%7Cbirthday%7C2026', {
      data: { action: 'approve' },
    });
    expect(r.status()).toBe(409);
    await page.goto('/orders');
    await expect(page.getByTestId('orders-list')).not.toContainText('Bill');
  });
});
