import { describe, expect, it } from 'vitest';

import { TITLES, sanitiseSvg, type OccasionType } from '@/domain';

import {
  CATALOGUE,
  LEGACY_TO_CATALOGUE,
  TAGS,
  designById,
  designsFor,
  filterDesigns,
  renderDesignSvg,
  resolveCardFace,
} from '..';
import { designIdFromSvg } from '../scene';

const input = { title: 'Happy birthday', name: 'Margaret', age: 60 };

describe('catalogue', () => {
  it('has at least 48 designs, 12 for birthdays and 3 for every other occasion, with unique ids', () => {
    expect(CATALOGUE.length).toBeGreaterThanOrEqual(48);
    expect(designsFor('birthday').length).toBeGreaterThanOrEqual(12);
    for (const occ of Object.keys(TITLES) as OccasionType[]) {
      expect(designsFor(occ).length, occ).toBeGreaterThanOrEqual(3);
    }
    expect(new Set(CATALOGUE.map((d) => d.id)).size).toBe(CATALOGUE.length);
  });

  it('declares valid metadata on every design', () => {
    for (const d of CATALOGUE) {
      expect(d.isAiMade).toBe(false);
      expect(d.title.length).toBeGreaterThan(2);
      expect(d.occasions.length).toBeGreaterThan(0);
      for (const t of d.tags) expect(TAGS).toContain(t);
      expect(d.supportsPhoto).toBe(d.tags.includes('photo upload'));
    }
  });

  it('renders every design under the sanitiser limit and through it unchanged in spirit', () => {
    for (const d of CATALOGUE) {
      for (const name of ['', 'Margaret', 'Priya and Tom']) {
        const svg = renderDesignSvg(d, { ...input, name, age: name ? 60 : null });
        expect(Buffer.byteLength(svg, 'utf8'), `${d.id} (${name || 'no name'})`).toBeLessThan(
          19_000,
        );
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).not.toMatch(/<script|onload|href=|url\(/i);
        expect(sanitiseSvg(svg), d.id).not.toBeNull();
        expect(designIdFromSvg(svg)).toBe(d.id);
      }
    }
  });

  it('stands in for every legacy design id and resolves card faces', () => {
    for (const id of Object.values(LEGACY_TO_CATALOGUE)) expect(designById(id), id).toBeDefined();
    const legacy = resolveCardFace({ design: 'balloons', customFront: null });
    expect(legacy.kind).toBe('design');
    const stored = resolveCardFace({
      design: 'balloons',
      customFront: { kind: 'svg', svg: renderDesignSvg(designById('mum-tulips')!, input) },
    });
    expect(stored.kind === 'svg' && stored.design?.id).toBe('mum-tulips');
    expect(
      resolveCardFace({
        design: 'balloons',
        customFront: { kind: 'media', url: '/x.jpg', mediaId: 'm' },
      }).kind,
    ).toBe('media');
  });

  it('filters by occasion, tag and text', () => {
    expect(filterDesigns({ occasion: 'eid' }).every((d) => d.occasions.includes('eid'))).toBe(true);
    expect(filterDesigns({ tags: ['photo upload'] }).every((d) => d.supportsPhoto)).toBe(true);
    expect(filterDesigns({ q: 'rangoli' }).map((d) => d.id)).toContain('diwali-rangoli');
    expect(
      filterDesigns({ occasion: 'birthday', tags: ['for kids'] }).length,
    ).toBeGreaterThanOrEqual(3);
  });
});
