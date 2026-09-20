import { describe, expect, it } from 'vitest';

import { PRINTERS } from '../constants';
import { blendedScore, isValidPostcode, normalisePostcode, postcodeArea, route } from '../routing';

describe('route', () => {
  it('sends Large Luxe from Shrewsbury to the specialist and Regular Signature from Manchester to mcr', () => {
    expect(route('SY3 7AB', 'large', 'luxe', PRINTERS).id).toBe('brum');
    expect(route('M20 2RN', 'regular', 'signature', PRINTERS).id).toBe('mcr');
  });
  it('sends an unknown area to the specialist', () => {
    expect(route('ZZ1 1ZZ', 'regular', 'classic', PRINTERS).id).toBe('brum');
  });
  it('prefers the higher score when two printers cover an area', () => {
    const a = { ...PRINTERS[0], id: 'a', score: 4.1, areas: ['XX'] };
    const b = { ...PRINTERS[0], id: 'b', score: 4.9, areas: ['XX'] };
    expect(route('XX1 1AA', 'regular', 'classic', [a, b]).id).toBe('b');
  });
  it('parses postcode areas and validates postcodes', () => {
    expect(postcodeArea('ec1r 5en')).toBe('EC');
    expect(postcodeArea('B13 8JP')).toBe('B');
    expect(isValidPostcode('M4 5JH')).toBe(true);
    expect(isValidPostcode('M45JH')).toBe(true);
    expect(isValidPostcode('nowhere')).toBe(false);
    expect(normalisePostcode('m45jh')).toBe('M4 5JH');
  });
  it('blends ratings so one five-star rating visibly moves the score', () => {
    expect(blendedScore(4.7, [], 20)).toBe(4.7);
    expect(blendedScore(4.7, [5], 20)).toBe(4.71);
    expect(blendedScore(4.7, [1], 20)).toBe(4.52);
  });
});
