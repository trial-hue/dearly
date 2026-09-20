import { expect, test } from '@playwright/test';

import { expectToast, proposalKeys, resetDemo } from '../helpers';
import { PRICES } from '../prices';

test.describe('API-level claims', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('G7 AI routes are rate limited with a friendly message, and the rules path keeps working', async ({
    page,
  }) => {
    let refused: { status: number; body: { title?: string; detail?: string } } | null = null;
    for (let i = 0; i < 40 && !refused; i++) {
      const r = await page.request.post('/api/ai/read_florist_order', {
        data: { text: 'Roses for Mum' },
      });
      if (r.status() === 429)
        refused = { status: 429, body: (await r.json()) as { title?: string; detail?: string } };
      else expect(r.ok()).toBeTruthy();
    }
    expect(refused).not.toBeNull();
    expect(refused!.body.title).toMatch(/too many/i);
    expect(refused!.body.detail).toMatch(/try again in \d+ seconds/i);
    // Fallbacks and everything else keep working while the AI route is limited.
    const rules = await page.request.post('/api/business/clean', {
      data: { text: 'Aisha Khan, 14/03/1991, birthday, M4 5JH' },
    });
    expect(rules.ok()).toBeTruthy();
    expect(((await rules.json()) as { by: string }).by).toBe('rule');
    expect((await page.request.get('/api/proposals')).ok()).toBeTruthy();
  });

  test('J2 uploads reject disallowed types and oversized files', async ({ page }) => {
    const bad = await page.request.post('/api/uploads', {
      multipart: {
        kind: 'photo',
        file: { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') },
      },
    });
    expect(bad.status()).toBe(415);
    const big = await page.request.post('/api/uploads', {
      multipart: {
        kind: 'photo',
        file: {
          name: 'big.png',
          mimeType: 'image/png',
          buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
        },
      },
    });
    expect(big.status()).toBe(413);
  });

  test('D1 every printed order has a 22+ character slug, a QR code on Orders, and the link resolves', async ({
    page,
  }) => {
    await page.goto('/reminders');
    await page.getByTestId('reminder-person_dan').getByTestId('reminder-approve').click();
    await expectToast(page, /Approved/);
    const orders = (await (await page.request.get('/api/orders')).json()) as {
      mode: string;
      slug: string;
      recipientPath: string;
    }[];
    const printed = orders.filter((o) => o.mode !== 'ecard');
    expect(printed.length).toBeGreaterThanOrEqual(3);
    for (const o of printed) {
      expect(o.slug.length).toBeGreaterThanOrEqual(22);
      expect(o.recipientPath).toBe(`/r/${o.slug}`);
      expect((await page.request.get(o.recipientPath)).status()).toBe(200);
    }
    expect(new Set(printed.map((o) => o.slug)).size).toBe(printed.length);
    await page.goto('/orders');
    expect(await page.getByTestId('order-qr').locator('svg').count()).toBeGreaterThanOrEqual(
      printed.length,
    );
  });

  test('J3 the recipient page exposes no sender address, email or other recipients', async ({
    page,
  }) => {
    const res = await page.request.get('/r/seed-dan-birthday-delivered-2025');
    const html = await res.text();
    expect(html).not.toContain('alex@dearly.invalid');
    for (const other of [
      'Margaret',
      'Priya',
      'Bill Ellis',
      'Sam Whitlock',
      'SY3 7AB',
      'LS6 3BQ',
      'M20 2RN',
      'B13 8JP',
    ])
      expect(html, other).not.toContain(other);
    expect(html).not.toMatch(/"postcode"|"address"|"email"/);
  });

  test('A8 the first-card-free flag cannot be set from the client', async ({ page }) => {
    const keys = await proposalKeys(page);
    const r = await page.request.patch(
      `/api/proposals/${encodeURIComponent(keys.person_dan as string)}`,
      {
        data: { action: 'edit', patch: { firstCardFree: true } },
      },
    );
    expect(r.ok()).toBeTruthy();
    const view = (await r.json()) as { quote: { firstCardFree: boolean; totalPence: number } };
    expect(view.quote.firstCardFree).toBe(false);
    expect(view.quote.totalPence).toBe(494);
    expect(PRICES.regularSignatureAdvance).toBe('£4.94');
  });

  test('G5 a life event proposes a pause and changes nothing until it is confirmed', async ({
    page,
  }) => {
    const r = await page.request.post('/api/ai/life_event', {
      data: { text: 'Grandad Bill passed away last week' },
    });
    expect(r.ok()).toBeTruthy();
    const body = (await r.json()) as {
      result: { action: string; personId: string | null };
      applied: boolean;
      personName: string | null;
    };
    expect(body.result.action).toBe('pause');
    expect(body.result.personId).toBe('person_bill');
    expect(body.applied).toBe(false);
    const people = (await (await page.request.get('/api/people')).json()) as {
      id: string;
      pausedReason: string | null;
    }[];
    expect(people.find((p) => p.id === 'person_bill')?.pausedReason).toBeNull();
    const confirm = await page.request.patch('/api/people', {
      data: { action: 'pause', id: 'person_bill', reason: 'Bereavement' },
    });
    expect(confirm.ok()).toBeTruthy();
    const after = (await (await page.request.get('/api/people')).json()) as {
      id: string;
      pausedReason: string | null;
    }[];
    expect(after.find((p) => p.id === 'person_bill')?.pausedReason).toBe('Bereavement');
  });

  test('F1 reading the florist order saves nothing', async ({ page }) => {
    const before = (await (await page.request.get('/api/operations')).json()) as {
      counters: { referrals: number };
    };
    const r = await page.request.post('/api/ai/read_florist_order', {
      data: { text: 'Roses for Mum, 70th birthday, deliver Friday 9 October 2026' },
    });
    expect(r.ok()).toBeTruthy();
    const after = (await (await page.request.get('/api/operations')).json()) as {
      counters: { referrals: number };
    };
    expect(after.counters.referrals).toBe(before.counters.referrals);
  });
});
