import { SPECIALIST_PRINTER_ID } from './constants';
import type { Finish, PrinterLike, Size } from './types';

/** Postcode area: the leading letters of a UK postcode, upper-cased. */
export function postcodeArea(postcode: string | null | undefined): string {
  const m = /^[A-Za-z]{1,2}/.exec((postcode ?? '').trim());
  return m ? m[0].toUpperCase() : '';
}

export const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function isValidPostcode(postcode: string): boolean {
  return UK_POSTCODE.test(postcode.trim());
}

export function normalisePostcode(postcode: string): string {
  const compact = postcode.toUpperCase().replace(/\s+/g, '');
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/**
 * Pick the printer whose areas include the postcode area and that can do the size and finish.
 * Several qualifying printers: the higher score wins. Otherwise the specialist.
 */
export function route<P extends PrinterLike>(
  postcode: string,
  size: Size,
  finish: Finish,
  printers: readonly P[],
): P {
  const area = postcodeArea(postcode);
  const candidates = printers
    .filter((p) => p.areas.includes(area) && p.sizes.includes(size) && p.finishes.includes(finish))
    .sort((a, b) => b.score - a.score);
  if (candidates[0]) return candidates[0];
  const specialist =
    printers.find((p) => p.id === SPECIALIST_PRINTER_ID) ??
    printers.find((p) => p.sizes.includes(size) && p.finishes.includes(finish));
  if (!specialist) throw new Error('No printer can produce this card');
  return specialist;
}

/** Blend a printer's seed score with session ratings so one rating visibly moves the figure. */
export function blendedScore(
  seedScore: number,
  ratings: readonly number[],
  weight: number,
): number {
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round(((seedScore * weight + sum) / (weight + ratings.length)) * 100) / 100;
}
