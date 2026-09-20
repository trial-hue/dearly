export { formatPence } from '@/domain/money';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const longFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function fmtDate(d: Date | string): string {
  return dateFmt.format(typeof d === 'string' ? new Date(d) : d);
}

export function fmtLong(d: Date | string): string {
  return longFmt.format(typeof d === 'string' ? new Date(d) : d);
}

export function fmtTime(d: Date | string): string {
  return timeFmt.format(typeof d === 'string' ? new Date(d) : d);
}

export function daysLabel(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} ago`;
  return `in ${days} days`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function humanise(s: string): string {
  return titleCase(s.replace(/_/g, ' '));
}
