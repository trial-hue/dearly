import { quote, type Finish, type Size } from '@/domain';

/** The "from" price of any card: a Regular Classic card by itself, from the quote function. */
export function fromPricePence(): number {
  return quote({ size: 'regular', finish: 'classic', mode: 'advance' }).cardPence;
}

/** Card-only price for a size and finish, from the quote function. */
export function cardPricePence(size: Size, finish: Finish): number {
  return quote({ size, finish, mode: size === 'giant' ? 'tracked' : 'advance' }).cardPence;
}
