import { describe, expect, it } from 'vitest';

import { agentFallback, type AgentOrderView } from '../agentRules';
import { AGENT_ACTIONS, RULES } from '../constants';
import { detectLifeEvent } from '../lifeEvent';
import { defaultProposal } from '../proposals';
import { planRecovery } from '../recovery';
import { SVG_MAX_BYTES, sanitiseSvg } from '../sanitiseSvg';
import type { OccasionLike, PersonLike } from '../types';

const today = new Date(2026, 8, 23);
const mother: PersonLike = {
  id: 'm',
  name: 'Margaret Ellis',
  relationship: 'mother',
  postcode: 'SY3 7AB',
  addrCheckedAt: new Date(2026, 8, 1),
  pausedReason: null,
};
const birthdayIn = (days: number, startYear: number): OccasionLike => {
  const d = new Date(2026, 8, 23 + days);
  return {
    id: 'o',
    type: 'birthday',
    monthDay: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    startYear,
    adhocDate: null,
  };
};

describe('B5 default choices', () => {
  it('gives Large, Luxe and flowers to a milestone for close family and Regular Classic to a colleague', () => {
    const d = defaultProposal({
      person: mother,
      occasion: birthdayIn(20, 1966),
      today,
      sender: 'Alex',
    })!;
    expect([d.card.size, d.card.finish, d.card.gift, d.card.design]).toEqual([
      'large',
      'luxe',
      'flowers',
      'bignumber',
    ]);
    const c = defaultProposal({
      person: { ...mother, id: 'c', name: 'Sam Whitlock', relationship: 'colleague' },
      occasion: birthdayIn(20, 1990),
      today,
      sender: 'Alex',
    })!;
    expect([c.card.size, c.card.finish]).toEqual(['regular', 'classic']);
  });
  it('uses the big-number design at 18, 21 and every multiple of 10, and not otherwise', () => {
    const year = 2026 + (new Date(2026, 8, 23 + 20) < today ? 1 : 0);
    const designAt = (age: number) =>
      defaultProposal({
        person: { ...mother, relationship: 'friend' },
        occasion: birthdayIn(20, year - age),
        today,
        sender: 'Alex',
      })!.card.design;
    for (const age of [18, 21, 30, 40, 50, 60, 70, 80, 90, 100])
      expect(designAt(age)).toBe('bignumber');
    for (const age of [17, 19, 22, 34, 45, 88]) expect(designAt(age)).not.toBe('bignumber');
  });
});

describe('C4 and C5 recovery plan', () => {
  const order = (mode: 'advance' | 'tracked' | 'pickup' | 'ecard', daysLeft: number) => ({
    id: 'ord_test1234',
    mode,
    guarantee: mode === 'advance' || mode === 'tracked',
    totalPence: 494,
    occasionDate: new Date(2026, 8, 23 + daysLeft),
  });
  it('C4 gives an on-the-day eCard, a full refund, a single-use 50% card-price code and a tracked reprint only with two or more days left', () => {
    const plan = planRecovery(order('advance', 4), today);
    expect(plan.map((a) => a.type)).toEqual(['ecard', 'refund', 'discount', 'reprint']);
    expect(plan.find((a) => a.type === 'refund')?.pence).toBe(494);
    const code = plan.find((a) => a.type === 'discount')!;
    expect(code.label).toMatch(/50% off the card price/);
    expect(code.detail).toMatch(/single-use/i);
    expect(code.detail).toMatch(/delivery not included/i);
    expect(planRecovery(order('tracked', 1), today).map((a) => a.type)).toEqual([
      'ecard',
      'refund',
      'discount',
    ]);
    expect(planRecovery(order('tracked', 2), today).map((a) => a.type)).toContain('reprint');
  });
  it('C5 never refunds a pick-up or eCard order', () => {
    expect(planRecovery(order('pickup', 3), today).some((a) => a.type === 'refund')).toBe(false);
    expect(planRecovery(order('ecard', 3), today).some((a) => a.type === 'refund')).toBe(false);
  });
});

describe('G4 agent guardrails', () => {
  const orders: AgentOrderView[] = [
    { id: 'o1', person: 'Dan Okafor', stage: 'posted', promised: '2026-09-30', late: false },
    { id: 'o2', person: 'Priya and Tom', stage: 'posted', promised: '2026-09-18', late: true },
  ];
  it('only ever returns the six allowed actions', () => {
    expect([...AGENT_ACTIONS].sort()).toEqual([
      'escalate',
      'none',
      'refund',
      'reprint',
      'send_ecard',
      'upgrade',
    ]);
    const messages = [
      'refund',
      'it is damaged',
      'where is it',
      'faster please',
      'send an ecard',
      'hello',
      'my uncle died',
      'Priya refund',
    ];
    for (const m of messages) expect(AGENT_ACTIONS).toContain(agentFallback(m, orders).action);
  });
  it('refunds only late or damaged orders', () => {
    expect(agentFallback('refund the card for Dan', orders).action).toBe('none');
    expect(agentFallback('refund the card for Priya', orders).action).toBe('refund');
    expect(agentFallback('refund', [{ ...orders[0]!, damaged: true }]).action).toBe('refund');
  });
  it('escalates any message mentioning a death or distress', () => {
    for (const m of [
      'Dan passed away last week',
      'my grandmother died',
      'I am so upset and distressed',
      'the funeral is Friday',
    ])
      expect(agentFallback(m, orders).action).toBe('escalate');
  });
});

describe('G5 life event reading', () => {
  it('targets Uncle Peter for a bereavement and proposes a pause', () => {
    const r = detectLifeEvent('Uncle Peter passed away in June', [
      { id: 'person_peter', name: 'Peter Ellis', relationship: 'uncle' },
      { id: 'person_dan', name: 'Dan Okafor', relationship: 'friend' },
    ]);
    expect(r.action).toBe('pause');
    expect(r.personId).toBe('person_peter');
  });
});

describe('J1 SVG sanitiser', () => {
  it('strips script, foreignObject, event attributes, href and external references', () => {
    const dirty = `<svg xmlns="http://www.w3.org/2000/svg" onload="x()"><script>alert(1)</script><foreignObject><div>hi</div></foreignObject><a href="https://evil"><rect onclick="y()"/></a><image href="https://evil/x.png"/><use xlink:href="#g"/><rect fill="url(https://evil/p.svg#p)"/><rect fill="url(#ok)"/></svg>`;
    const clean = sanitiseSvg(dirty)!;
    expect(clean).not.toBeNull();
    expect(clean).not.toMatch(/<script|foreignObject|onload|onclick|href|evil|<image|<use/i);
    expect(clean).toContain('url(#ok)');
  });
  it('rejects non-SVG input and anything over the size limit', () => {
    expect(sanitiseSvg('<div>no</div>')).toBeNull();
    expect(sanitiseSvg(`<svg>${'x'.repeat(SVG_MAX_BYTES)}</svg>`)).toBeNull();
  });
});

describe('D5 inventory rules', () => {
  it('keeps cards for three years and warns 20 days before expiry', () => {
    expect(RULES.inventoryYears).toBe(3);
    expect(RULES.inventoryWarnDays).toBe(20);
  });
});
