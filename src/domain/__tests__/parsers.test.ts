import { describe, expect, it } from 'vitest';

import { agentFallback } from '../agentRules';
import { expectedCommissionPence, parseFloristOrder, sampleFloristOrder } from '../florist';
import { parseImportLine, parseImportText } from '../importPeople';
import { detectLifeEvent } from '../lifeEvent';
import { sanitiseSvg } from '../sanitiseSvg';

describe('parseImportLine', () => {
  it('reads name, relationship, occasion and date in any order', () => {
    expect(parseImportLine('Jo Ellis, sister, birthday, 14 March 1990')).toEqual({
      name: 'Jo Ellis',
      relationship: 'sister',
      occasion: 'birthday',
      month: 3,
      day: 14,
      year: 1990,
    });
    expect(parseImportLine('Ravi Mehta, friend, diwali')).toMatchObject({
      name: 'Ravi Mehta',
      relationship: 'friend',
      occasion: 'diwali',
      month: null,
    });
    expect(parseImportLine('Nan, grandmother, birthday, 2 Feb 1941')).toMatchObject({
      relationship: 'grandmother',
      month: 2,
      day: 2,
      year: 1941,
    });
    expect(parseImportLine('Mum 14/03')).toMatchObject({
      name: 'Mum 14/03',
      relationship: 'mother',
    });
    expect(parseImportLine('')).toBeNull();
    expect(parseImportText('a, friend\n\nb, uncle, christmas')).toHaveLength(2);
  });
});

describe('parseFloristOrder', () => {
  it('reads the sample order', () => {
    const today = new Date(2026, 8, 20);
    const r = parseFloristOrder(sampleFloristOrder(today));
    expect(r).toMatchObject({
      recipient: 'Mrs J Sharma',
      relationship: 'mother',
      occasion: 'birthday',
      age: 70,
      customer: 'Claire',
      basketPence: 3500,
      date: '2026-10-09',
    });
    expect(expectedCommissionPence(3500)).toBe(245);
  });
  it('copes with a bare order', () => {
    expect(parseFloristOrder('Roses for Dad, happy anniversary')).toMatchObject({
      relationship: 'father',
      occasion: 'anniversary',
      date: null,
      age: null,
    });
  });
});

describe('detectLifeEvent', () => {
  const people = [
    { id: 'peter', name: 'Peter Ellis', relationship: 'uncle' },
    { id: 'priya', name: 'Priya and Tom', relationship: 'friends' },
    { id: 'dan', name: 'Dan Okafor', relationship: 'friend' },
  ];
  it('targets Uncle Peter for a bereavement', () => {
    expect(detectLifeEvent('Uncle Peter passed away in June', people)).toEqual({
      personId: 'peter',
      action: 'pause',
      reason: 'Bereavement',
    });
  });
  it('pauses a couple who split up and does nothing without a person or keyword', () => {
    expect(detectLifeEvent('Priya and Tom have split up', people)).toEqual({
      personId: 'priya',
      action: 'pause',
      reason: 'Separated',
    });
    expect(detectLifeEvent('Dan moved house', people)).toEqual({
      personId: 'dan',
      action: 'none',
      reason: 'No pause needed',
    });
    expect(detectLifeEvent('someone died', people).action).toBe('none');
  });
});

describe('agentFallback', () => {
  const orders = [
    { id: 'o1', person: 'Dan Okafor', stage: 'posted', promised: '2026-09-27', late: false },
    { id: 'o2', person: 'Priya and Tom', stage: 'posted', promised: '2026-09-18', late: true },
  ];
  it('reprints a card that has not arrived and refunds only late orders', () => {
    expect(agentFallback("my card for Dan hasn't arrived", orders)).toMatchObject({
      action: 'reprint',
      orderId: 'o1',
    });
    expect(agentFallback('I want a refund for Dan', orders)).toMatchObject({
      action: 'none',
      orderId: 'o1',
    });
    expect(agentFallback('refund the card for Priya please', orders)).toMatchObject({
      action: 'refund',
      orderId: 'o2',
    });
  });
  it('escalates distress and handles the rest', () => {
    expect(agentFallback('Dan passed away last week', orders).action).toBe('escalate');
    expect(agentFallback('the card for Dan arrived damaged', orders).action).toBe('reprint');
    expect(agentFallback('can Dan get it sooner', orders).action).toBe('upgrade');
    expect(agentFallback('hello', orders).action).toBe('none');
    expect(agentFallback('where is the card for Zed', [])).toMatchObject({
      action: 'none',
      orderId: null,
    });
  });
});

describe('sanitiseSvg', () => {
  it('strips scripts, event attributes, foreignObject and links', () => {
    const dirty = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 370" onload="alert(1)"><script>alert(1)</script><foreignObject><div>x</div></foreignObject><a href="https://evil"><rect width="10" height="10" onclick='x()' fill="url(https://evil/a.png)"/></a><image href="x.png"/><circle r="4"/></svg>`;
    const clean = sanitiseSvg(dirty)!;
    expect(clean).not.toBeNull();
    expect(clean).not.toMatch(/script|foreignObject|onload|onclick|href|evil|<image/);
    expect(clean).toContain('<circle r="4"/>');
  });
  it('rejects non-SVG and oversized input', () => {
    expect(sanitiseSvg('<div>no</div>')).toBeNull();
    expect(sanitiseSvg(`<svg>${'x'.repeat(25_000)}</svg>`)).toBeNull();
    expect(
      sanitiseSvg('Sure, here it is: <svg viewBox="0 0 264 370"><rect/></svg> hope you like it'),
    ).toBe('<svg viewBox="0 0 264 370"><rect/></svg>');
  });
});
