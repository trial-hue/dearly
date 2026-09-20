/** Convert a pounds figure (as written in the constants) to integer pence. */
export function toPence(pounds: number): number {
  return Math.round(pounds * 100);
}

/** Format integer pence as a pounds string, e.g. 494 -> "£4.94". */
export function formatPence(pence: number): string {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  return `${sign}£${(abs / 100).toFixed(2)}`;
}

/** Ex-VAT share of an inc-VAT amount at 20%, in pence. */
export function exVat(pence: number): number {
  return Math.round(pence / 1.2);
}

export function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}
