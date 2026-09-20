/** Convert a pounds figure (as written in the constants) to integer pence. */
export function toPence(pounds: number): number {
  return Math.round(pounds * 100);
}

/** Round half up, away from zero, once at the end of a calculation. */
export function roundPence(pence: number): number {
  const r = Math.round(Math.abs(pence) + 1e-9);
  return pence < 0 ? -r : r;
}

/** Format integer pence as a pounds string, e.g. 494 -> "£4.94". */
export function formatPence(pence: number): string {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  return `${sign}£${(abs / 100).toFixed(2)}`;
}

/** Ex-VAT share of an inc-VAT amount at 20%, exact (round with roundPence at the end). */
export function exVatExact(pence: number): number {
  return pence / 1.2;
}

/** Ex-VAT share of an inc-VAT amount at 20%, in whole pence. */
export function exVat(pence: number): number {
  return roundPence(exVatExact(pence));
}

export function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}
