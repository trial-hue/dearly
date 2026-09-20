import {
  addDays,
  isoDate,
  isoFrom,
  monthDayFrom,
  nextOccurrence,
  parseFlexibleDate,
  startOfDay,
} from './calendar';
import { BUSINESS, BUSINESS_COSTS, DEFAULT_COSTS, MODES, PRICE, PRINT_COST } from './constants';
import { roundPence, toPence } from './money';
import { isValidPostcode, normalisePostcode } from './routing';
import type { Costs } from './types';

export type BusinessFinish = (typeof BUSINESS.finishes)[number];

export type StaffOccasion = 'birthday' | 'work_anniversary' | 'leaving';
export type DeliveryOption = 'posted' | 'officeDrop';

export interface StaffRow {
  raw: string;
  name: string;
  date: string | null; // ISO when a year is known, else 'MM-DD' padded to a full date is not possible
  monthDay: string | null;
  year: number | null;
  occasion: StaffOccasion;
  postcode: string;
  issue: string | null;
}

function normaliseOccasion(text: string): StaffOccasion | null {
  const t = text.toLowerCase().replace(/[_-]/g, ' ').trim();
  if (t.includes('birth')) return 'birthday';
  if (t.includes('work') || t.includes('anniv') || t.includes('start')) return 'work_anniversary';
  if (t.includes('leav') || t.includes('farewell') || t.includes('goodbye')) return 'leaving';
  return null;
}

/**
 * Strict parser for one staff row: "name, date, occasion, postcode". Unparseable dates and
 * missing or invalid postcodes are flagged rather than guessed.
 */
export function parseStaffRow(raw: string): StaffRow {
  const parts = raw.split(',').map((s) => s.trim());
  const name = parts[0] ?? '';
  const dateText = parts[1] ?? '';
  const occasionText = parts[2] ?? '';
  const postcodeText = parts[3] ?? '';
  const issues: string[] = [];

  if (!name) issues.push('missing name');
  const parsed = dateText ? parseFlexibleDate(dateText) : null;
  if (!parsed) issues.push(dateText ? `invalid date "${dateText}"` : 'missing date');
  const occasion = normaliseOccasion(occasionText) ?? 'birthday';
  if (!normaliseOccasion(occasionText) && occasionText)
    issues.push(`unknown occasion "${occasionText}"`);
  let postcode = '';
  if (!postcodeText) issues.push('missing postcode');
  else if (!isValidPostcode(postcodeText)) issues.push(`invalid postcode "${postcodeText}"`);
  else postcode = normalisePostcode(postcodeText);

  return {
    raw,
    name,
    date: parsed && parsed.year != null ? isoFrom({ ...parsed, year: parsed.year }) : null,
    monthDay: parsed ? monthDayFrom(parsed) : null,
    year: parsed?.year ?? null,
    occasion,
    postcode,
    issue: issues.length ? issues.join('; ') : null,
  };
}

/** Parse a pasted list, one row per line, flagging duplicates of an earlier row. */
export function cleanStaffList(text: string): StaffRow[] {
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(parseStaffRow);
  const seen = new Map<string, number>();
  rows.forEach((row, i) => {
    const key = `${row.name.toLowerCase()}|${row.monthDay ?? ''}`;
    const first = seen.get(key);
    if (row.name && first !== undefined) {
      row.issue = row.issue
        ? `${row.issue}; duplicate of row ${first + 1}`
        : `duplicate of row ${first + 1}`;
    } else if (row.name) {
      seen.set(key, i);
    }
  });
  return rows;
}

/** Rows that can be scheduled: no issue, or only a missing postcode when dropping at the office. */
export function schedulable(row: StaffRow, option: DeliveryOption): boolean {
  if (!row.issue) return true;
  return option === 'officeDrop' && row.issue === 'missing postcode';
}

/** Send date: the next occurrence of the occasion minus the lead time for the delivery option. */
export function sendDateFor(row: StaffRow, option: DeliveryOption, today: Date): Date | null {
  const t = startOfDay(today);
  let occasionDate: Date | null = null;
  if (row.occasion === 'leaving') {
    if (row.date) occasionDate = new Date(row.date);
    else if (row.monthDay) occasionDate = nextOccurrence(row.monthDay, t);
  } else if (row.monthDay) {
    occasionDate = nextOccurrence(row.monthDay, t);
  }
  if (!occasionDate) return null;
  const lead = option === 'posted' ? 3 : 1;
  const send = addDays(occasionDate, -lead);
  return send < t ? t : send;
}

/** Posted price per card by annual volume; office drop is flat. All ex VAT, in pence. */
export function businessUnitPricePence(annualCards: number, option: DeliveryOption): number {
  if (option === 'officeDrop') return toPence(BUSINESS.officeDrop);
  if (annualCards >= 2000) return toPence(BUSINESS.tier2000);
  if (annualCards >= 250) return toPence(BUSINESS.tier250);
  return toPence(BUSINESS.posted);
}

export interface BatchPricing {
  cards: number;
  unitPence: number;
  giantCards: number;
  giantUnitPence: number;
  freeCards: number;
  totalPence: number;
  costPence: number;
  contributionPence: number;
  contributionPerCardPence: number;
}

export interface BatchOptions {
  option: DeliveryOption;
  finish: BusinessFinish;
  annualCards: number;
  automate: boolean;
  giantCards?: number;
  costs?: Costs;
}

/** Per-card cost to Dearly of a business card, ex VAT, exact pence: print, delivery, AI, service, guarantee reserve. */
export function businessUnitCostExact(
  option: DeliveryOption,
  finish: BusinessFinish,
  costs: Costs = DEFAULT_COSTS,
): number {
  const delivery =
    option === 'posted'
      ? toPence(MODES.advance.cost.regular)
      : toPence(BUSINESS_COSTS.officeDropDelivery);
  return (
    toPence(PRINT_COST.regular[finish]) +
    delivery +
    toPence(costs.ai) +
    toPence(costs.service) +
    toPence(costs.guarantee)
  );
}

/** Contribution of one business card at a unit price, ex VAT: price minus costs minus 1% payment on the price. */
export function businessUnitContributionPence(
  unitPence: number,
  option: DeliveryOption,
  finish: BusinessFinish = 'signature',
  costs: Costs = DEFAULT_COSTS,
): number {
  return roundPence(
    unitPence - businessUnitCostExact(option, finish, costs) - BUSINESS.paymentPct * unitPence,
  );
}

/** Price and contribution of one batch, ex VAT, in pence. Payment is 1% of the invoice. */
export function priceBatch(cards: number, opts: BatchOptions): BatchPricing {
  const costs = opts.costs ?? DEFAULT_COSTS;
  const giantCards = Math.min(opts.giantCards ?? 0, cards);
  const regularCards = cards - giantCards;
  const unitPence = businessUnitPricePence(opts.annualCards, opts.option);
  const freeCards = opts.automate ? Math.min(BUSINESS.freeCards, regularCards) : 0;
  const giantUnitPence = roundPence(
    (toPence(PRICE.giant.signature) + toPence(MODES.tracked.price.giant)) / 1.2,
  );
  const totalPence = (regularCards - freeCards) * unitPence + giantCards * giantUnitPence;

  const perCardCost = businessUnitCostExact(opts.option, opts.finish, costs);
  const perGiantCost =
    toPence(PRINT_COST.giant.signature) +
    toPence(MODES.tracked.cost.giant) +
    toPence(costs.ai) +
    toPence(costs.service) +
    toPence(costs.guarantee);
  const paymentExact = BUSINESS.paymentPct * totalPence;
  const costExact = regularCards * perCardCost + giantCards * perGiantCost + paymentExact;
  return {
    cards,
    unitPence,
    giantCards,
    giantUnitPence,
    freeCards,
    totalPence,
    costPence: roundPence(costExact),
    contributionPence: roundPence(totalPence - costExact),
    contributionPerCardPence: cards > 0 ? roundPence((totalPence - costExact) / cards) : 0,
  };
}

export interface AnnualCalculator {
  cardsPerYear: number;
  postedShare: number; // 0..1
  automate: boolean;
}

export interface AnnualResult {
  posted: number;
  office: number;
  unitPostedPence: number;
  dearlyPence: number;
  subscriptionPence: number;
  includedCards: number;
  moonpigPence: number;
  savingPence: number;
}

/** Yearly cost for a business against Moonpig at £3.60 a card. */
export function annualCalculator(input: AnnualCalculator): AnnualResult {
  const posted = Math.round(input.cardsPerYear * input.postedShare);
  const office = input.cardsPerYear - posted;
  const unitPostedPence = businessUnitPricePence(input.cardsPerYear, 'posted');
  const subscriptionPence = input.automate ? toPence(BUSINESS.automateMonthly) * 12 : 0;
  const includedCards = input.automate ? Math.min(BUSINESS.freeCards, posted) : 0;
  const dearlyPence =
    subscriptionPence +
    (posted - includedCards) * unitPostedPence +
    office * toPence(BUSINESS.officeDrop);
  const moonpigPence = input.cardsPerYear * toPence(BUSINESS.moonpigPerCard);
  return {
    posted,
    office,
    unitPostedPence,
    dearlyPence,
    subscriptionPence,
    includedCards,
    moonpigPence,
    savingPence: moonpigPence - dearlyPence,
  };
}

/** The seeded ten-row staff list with deliberate mess. The leaver's date is tomorrow. */
export function seedStaffText(today: Date): string {
  const tomorrow = addDays(startOfDay(today), 1);
  const d = String(tomorrow.getDate()).padStart(2, '0');
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  return [
    'Aisha Khan, 14/03/1991, birthday, M4 5JH',
    'Ben Carter, 1988-11-02, birthday, M15 6BH',
    'Chloe Daly, 7 Aug 1995, birthday,',
    'Dev Mistry, 02.11.1990, birthday, SK4 2AA',
    'Aisha Khan, 14/03/1991, birthday, M4 5JH',
    'Femi Adeyemi, 23/09/2019, work anniversary, M20 3LP',
    'Grace Lin, March 30, birthday, WA14 1AA',
    'Hannah Moss, 31/02/1993, birthday, M1 1AE',
    `Sam Whitlock, ${d}/${m}/${tomorrow.getFullYear()}, leaving, EC1R 5EN`,
    'Ibrahim Yusuf, 5/6/87, birthday, M3 3EB',
  ].join('\n');
}

export function staffRowsSummary(
  rows: StaffRow[],
  option: DeliveryOption,
): { scheduled: number; flagged: number } {
  const scheduled = rows.filter((r) => schedulable(r, option)).length;
  return { scheduled, flagged: rows.length - scheduled };
}

export { isoDate };
