import { expect, test, type Page } from '@playwright/test';

import { pngBuffer, wavBuffer } from '../../src/server/__tests__/png';
import { openEditorFor, resetDemo, runNextStepUntil } from '../helpers';
import { PRICES } from '../prices';

/** Approve the open editor's card and return the order's test id on Orders. */
async function approveAndFindOrder(page: Page, who: RegExp): Promise<string> {
  await page.getByTestId('approve').click();
  await expect(page).toHaveURL(/\/orders/);
  const order = page
    .getByTestId('orders-list')
    .locator('[data-testid^="order-"]')
    .filter({ hasText: who })
    .first();
  await expect(order).toBeVisible();
  return (await order.getAttribute('data-testid')) as string;
}

test.describe('H. rich cards and D2 the recipient page', () => {
  test.beforeEach(async ({ page }) => resetDemo(page));

  test('H1 the photo check passes, suggests a smaller size or warns at 1,200, 1,800 and 2,600 pixels; handwriting becomes an ink-only layer', async ({
    page,
  }) => {
    await openEditorFor(page, 'person_dan');
    await page.getByTestId('step-3').click();
    const verdict = page.getByTestId('photo-verdict');
    const check = async (px: number) => {
      await page
        .locator('#photo-input')
        .setInputFiles({ name: `p${px}.png`, mimeType: 'image/png', buffer: pngBuffer(px, 10) });
      await expect(verdict).toContainText(`${px} × 10 px`);
      return (await verdict.textContent()) ?? '';
    };
    // Regular needs 1,200.
    expect(await check(1200)).toMatch(/Sharp enough for a Regular/);
    expect(await check(600)).toMatch(/Too small for Regular.*Try a larger original/);
    // Large needs 1,800: a 1,200 photo is offered at Regular instead.
    await page.getByTestId('step-1').click();
    await page.getByTestId('size-large').click();
    await page.getByTestId('step-3').click();
    expect(await check(1800)).toMatch(/Sharp enough for a Large/);
    expect(await check(1200)).toMatch(/Too small for Large.*print well at Regular/);
    // Giant needs 2,600.
    await page.getByTestId('step-1').click();
    await page.getByTestId('size-giant').click();
    await page.getByTestId('step-3').click();
    expect(await check(2600)).toMatch(/Sharp enough for a Giant/);
    expect(await check(1800)).toMatch(/Too small for Giant.*print well at Regular or Large/);

    // Handwriting: dark strokes on white paper become ink on a transparent background.
    await page.locator('#handwriting-input').setInputFiles({
      name: 'hand.png',
      mimeType: 'image/png',
      buffer: pngBuffer(300, 200, true),
    });
    await expect(page.getByTestId('handwriting-badge')).toBeVisible();
    const key = await page.evaluate(
      () => location.pathname.split('/personalise/')[1]?.split('?')[0] ?? '',
    );
    const proposal = (await (await page.request.get(`/api/proposals/${key}`)).json()) as {
      card: { handwriting: { url: string } };
    };
    const url = proposal.card.handwriting.url;
    const alpha = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let transparent = 0;
      let opaque = 0;
      let partial = 0;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] === 0) transparent++;
        else if (d[i] === 255) opaque++;
        else partial++;
      }
      return { transparent, opaque, partial, total: d.length / 4 };
    }, url);
    expect(alpha.partial).toBe(0);
    expect(alpha.transparent).toBeGreaterThan(alpha.total * 0.5); // the paper
    expect(alpha.opaque).toBeGreaterThan(alpha.total * 0.05); // the ink
  });

  test('H2 narration works by microphone, by upload and by built-in voice; the text reveals word by word; a blocked microphone still completes', async ({
    page,
  }) => {
    // Upload: the recipient page reveals the message across the audio duration.
    await openEditorFor(page, 'person_dan');
    await page.getByTestId('ecard-toggle').check();
    await page.getByTestId('step-4').click();
    await page
      .getByTestId('upload-narration')
      .setInputFiles({ name: 'n.wav', mimeType: 'audio/wav', buffer: wavBuffer(3) });
    await expect(page.getByTestId('extras').locator('audio')).toBeVisible();
    const orderId = await approveAndFindOrder(page, /Dan/);
    await page.getByTestId(orderId).getByTestId('open-recipient').click();
    await expect(page.getByTestId('recipient-view')).toBeVisible();
    const words = page.getByTestId('narrated-message').locator('.word');
    const total = await words.count();
    expect(total).toBeGreaterThan(5);
    await page.getByTestId('play-narration').click();
    await expect
      .poll(
        async () => {
          const on = await page.getByTestId('narrated-message').locator('.word-on').count();
          return on > 0 && on < total;
        },
        { timeout: 4000 },
      )
      .toBe(true);
    await expect(page.getByTestId('narrated-message').locator('.word-on')).toHaveCount(total, {
      timeout: 8000,
    });

    // Microphone (a fake device is granted by the browser flags).
    await resetDemo(page);
    await openEditorFor(page, 'person_dan');
    await page.getByTestId('ecard-toggle').check();
    await page.getByTestId('step-4').click();
    await page.getByTestId('record-narration').click();
    await expect(page.getByTestId('stop-recording')).toBeVisible();
    await page.waitForTimeout(1200);
    await page.getByTestId('stop-recording').click();
    await expect(page.getByTestId('extras').locator('audio')).toBeVisible({ timeout: 10_000 });
    await approveAndFindOrder(page, /Dan/);

    // Built-in voice, with the microphone denied: the flow still completes.
    await resetDemo(page);
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    });
    await openEditorFor(page, 'person_dan');
    await page.getByTestId('ecard-toggle').check();
    await page.getByTestId('step-4').click();
    await page.getByTestId('record-narration').click();
    await expect(page.getByTestId('recording-blocked')).toBeVisible();
    await page.getByTestId('builtin-voice').click();
    await expect(page.getByTestId('builtin-voice')).toHaveAttribute('aria-pressed', 'true');
    await approveAndFindOrder(page, /Dan/);
  });

  test('H3 a narrated eCard is sent for 0.79, shows as delivered in Orders and appears in the Inventory', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('home-ecards').click();
    await expect(page).toHaveURL(/\/ecards/);
    await page.getByTestId('product-tile-bday-confetti-pop').click();
    await expect(page.getByTestId('product-ecard')).toBeChecked();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.ecard);
    await page.getByTestId('product-personalise').click();
    await page.getByTestId('recipient-select').selectOption('person_dan');
    await page.getByTestId('recipient-continue').click();
    await expect(page.getByTestId('editor')).toBeVisible();
    await expect(page.getByTestId('ecard-toggle')).toBeChecked();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.ecard);
    await page.getByTestId('step-2').click();
    await expect(page.getByTestId('message-input')).toHaveValue(/Dan/);
    await page.getByTestId('step-4').click();
    await page
      .getByTestId('upload-narration')
      .setInputFiles({ name: 'n.wav', mimeType: 'audio/wav', buffer: wavBuffer(2) });
    await expect(page.getByTestId('approve')).toContainText(PRICES.ecard);
    const orderId = await approveAndFindOrder(page, /Dan/);
    const order = page.getByTestId(orderId);
    await expect(order).toContainText('eCard');
    await expect(order).toContainText(PRICES.ecard);
    await expect(order.getByTestId('stage-current')).toHaveText('Delivered');
    await page.goto('/my-cards?tab=sent');
    await expect(
      page.locator('[data-testid^="mycard-"]').filter({ hasText: /Dan/ }).first(),
    ).toBeVisible();
  });

  test('D2 the recipient page works without a digital copy; narration, animation and clip appear only when the copy was bought', async ({
    page,
  }) => {
    // Without the copy: view, rate, save, send one back; no animation, narration or clip.
    await page.goto('/r/seed-dan-birthday-delivered-2025');
    await expect(page.getByTestId('recipient-view')).toBeVisible();
    await expect(page.getByTestId('star-5')).toBeVisible();
    await expect(page.getByTestId('save-to-dearly')).toBeEnabled();
    await expect(page.getByTestId('send-one-back')).toBeEnabled();
    await expect(page.getByTestId('play-narration')).toHaveCount(0);
    await expect(page.getByTestId('recipient-clip')).toHaveCount(0);
    await expect(page.locator('.anim-stage')).not.toHaveClass(/anim-(envelope|flip|confetti)/);

    // With the 0.29 copy and a narration: the recipient gets the animation and the narration.
    await openEditorFor(page, 'person_dan');
    await page.getByTestId('step-4').click();
    await page.getByTestId('digital-copy').check();
    await expect(page.getByTestId('price-total')).toHaveText(PRICES.regularSignatureAdvanceDigital);
    await page
      .getByTestId('upload-narration')
      .setInputFiles({ name: 'n.wav', mimeType: 'audio/wav', buffer: wavBuffer(2) });
    const orderId = await approveAndFindOrder(page, /Dan/);
    await runNextStepUntil(page, orderId, 'Delivered');
    await page.getByTestId(orderId).getByTestId('open-recipient').click();
    await expect(page.getByTestId('recipient-view')).toBeVisible();
    await expect(page.locator('.anim-stage')).toHaveClass(/anim-(envelope|flip|confetti)/);
    await expect(page.getByTestId('play-narration')).toBeVisible();
  });
});
