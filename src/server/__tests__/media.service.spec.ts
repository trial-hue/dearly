import { beforeEach, describe, expect, it } from 'vitest';

import { SIZES } from '@/domain';
import { imageDimensions, storeUpload } from '@/server/services/media';

import { DEMO_ACCOUNT_ID, resetDemo } from './helpers';
import { pngBuffer } from './png';

describe('J2 uploads', () => {
  beforeEach(() => resetDemo());

  it('rejects disallowed types and files over the size limit, and accepts a valid image with its pixel size', async () => {
    const text = await storeUpload(
      DEMO_ACCOUNT_ID,
      'photo',
      new File(['hello'], 'x.txt', { type: 'text/plain' }),
    );
    expect(text).toMatchObject({ ok: false, status: 415 });
    const svg = await storeUpload(
      DEMO_ACCOUNT_ID,
      'photo',
      new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }),
    );
    expect(svg).toMatchObject({ ok: false, status: 415 });
    const big = await storeUpload(
      DEMO_ACCOUNT_ID,
      'photo',
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }),
    );
    expect(big).toMatchObject({ ok: false, status: 413 });
    const ok = await storeUpload(
      DEMO_ACCOUNT_ID,
      'photo',
      new File([new Uint8Array(pngBuffer(1200, 800))], 'p.png', { type: 'image/png' }),
    );
    expect(ok).toMatchObject({ ok: true, width: 1200, height: 800, mimeType: 'image/png' });
  });

  it('H1 reads the long edge that the photo check compares with 1,200, 1,800 and 2,600 pixels', () => {
    expect([SIZES.regular.minPx, SIZES.large.minPx, SIZES.giant.minPx]).toEqual([1200, 1800, 2600]);
    for (const w of [1200, 1800, 2600])
      expect(imageDimensions(pngBuffer(w, 10), 'image/png')).toEqual({ width: w, height: 10 });
  });
});
