import { expect, test } from '@playwright/test';

import { proposalKeys, resetDemo, visibleText } from '../helpers';

const FORBIDDEN = [
  'Built-in rules',
  'AI connected',
  'simulated',
  'pilot',
  'Mock AI',
  'rewrite_message',
  'import_people',
  'life_event',
  'clean_staff_list',
  'read_florist_order',
  'agent_turn',
  'card_front',
  'actor:',
];

test.describe('I. customer-facing integrity', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('I1 no customer screen shows internal wording', async ({ page }) => {
    const keys = await proposalKeys(page);
    const routes = [
      '/',
      '/cards',
      '/cards/birthday',
      '/card/bday-balloon-bunch',
      '/ecards',
      '/reminders',
      '/reminders?tab=coming',
      '/reminders?tab=people',
      '/basket',
      '/orders',
      '/my-cards',
      '/account',
      '/help',
      `/personalise/${encodeURIComponent(keys.person_dan as string)}?from=reminder`,
      '/r/seed-dan-birthday-delivered-2025',
    ];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const text = await visibleText(page);
      for (const word of FORBIDDEN)
        expect(text, `${route} shows "${word}"`).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
    }
  });

  test('I4 old routes redirect and no navigation link returns 404', async ({ page }) => {
    for (const [from, to] of [
      ['/today', '/reminders'],
      ['/people', '/reminders'],
      ['/studio', '/cards'],
      ['/inventory', '/my-cards'],
      ['/florists', '/hq/partners'],
      ['/operations', '/hq/operations'],
    ]) {
      const res = await page.request.get(from as string, { maxRedirects: 0 });
      expect([301, 302, 307, 308], from).toContain(res.status());
      expect(res.headers().location, from).toContain(to as string);
    }
    const seen = new Set<string>();
    for (const start of ['/', '/hq/operations', '/business']) {
      await page.goto(start);
      const hrefs = await page
        .locator('header a[href], nav a[href], footer a[href]')
        .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''));
      for (const href of hrefs) {
        if (!href.startsWith('/') || href.startsWith('/api') || seen.has(href)) continue;
        seen.add(href);
        const res = await page.request.get(href);
        expect(res.status(), href).toBeLessThan(400);
      }
    }
    expect(seen.size).toBeGreaterThan(8);
  });

  test('every flow fits 360px wide without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const keys = await proposalKeys(page);
    for (const route of [
      '/',
      '/cards/birthday',
      '/card/bday-balloon-bunch',
      '/reminders',
      '/basket',
      '/orders',
      '/my-cards',
      `/personalise/${encodeURIComponent(keys.person_dan as string)}?from=reminder`,
      '/r/seed-dan-birthday-delivered-2025',
      '/business/send',
      '/hq/operations',
    ]) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // The page must not scroll sideways, and nothing outside a scroll row may poke past the edge.
      const result = await page.evaluate(() => {
        window.scrollTo(5000, 0);
        const x = window.scrollX;
        const w = document.documentElement.clientWidth;
        const inScroller = (el: Element) => {
          for (let a = el.parentElement; a; a = a.parentElement) {
            const o = getComputedStyle(a).overflowX;
            if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
          }
          return false;
        };
        const offenders: string[] = [];
        for (const el of Array.from(document.querySelectorAll('body *'))) {
          const rect = el.getBoundingClientRect();
          if (rect.right > w + 2 && rect.width > 20 && !inScroller(el))
            offenders.push(
              `${el.tagName.toLowerCase()} ${el.getAttribute('data-testid') ?? ''} right=${Math.round(rect.right)}`,
            );
        }
        return { x, offenders: offenders.slice(0, 5) };
      });
      expect(result.x, route).toBe(0);
      expect(result.offenders, route).toEqual([]);
    }
  });
});
