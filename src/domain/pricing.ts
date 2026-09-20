import {
  DEFAULT_COSTS,
  DIGITAL,
  FINISHES,
  FIRST_CARD_FREE,
  GIFTS,
  GIFT_COST_SHARE,
  GUARANTEE,
  MODES,
  MOONPIG,
  PICKUP,
  PRICE,
  PRINT_COST,
  SIZES,
} from './constants';
import { modeCost, modePrice, pickupAllowed } from './delivery';
import { exVatExact, roundPence, toPence } from './money';
import type {
  ContributionRow,
  Costs,
  Finish,
  GiftId,
  Mode,
  PrintedMode,
  Quote,
  QuoteLine,
  Size,
} from './types';

export interface QuoteInput {
  size: Size;
  finish: Finish;
  mode: Mode;
  digital?: boolean;
  gift?: GiftId;
  /** The account's first card: the card price is free; delivery, digital copy and gifts are charged. */
  firstCardFree?: boolean;
  /** A guarantee code from a missed delivery: 50% off the card price only, once. */
  nextCardDiscount?: boolean;
}

export function giftPrice(gift: GiftId | undefined): number {
  return GIFTS.find((g) => g.id === gift)?.price ?? 0;
}

/**
 * Whether an account may take its first card free: no printed card ordered yet and at least three
 * reminder dates saved. The size, finish and mode are checked by firstCardFreeApplies.
 */
export function firstCardFreeEligible(account: {
  printedOrders: number;
  reminderDates: number;
}): boolean {
  return account.printedOrders === 0 && account.reminderDates >= FIRST_CARD_FREE.minReminders;
}

/** Whether the first-card-free offer applies to a size and finish (once per account, checked elsewhere). */
export function firstCardFreeApplies(size: Size, finish: Finish, mode: Mode): boolean {
  return (
    mode !== 'ecard' &&
    (FIRST_CARD_FREE.sizes as readonly string[]).includes(size) &&
    (FIRST_CARD_FREE.finishes as readonly string[]).includes(finish)
  );
}

/**
 * Price and cost of one card in integer pence. Arithmetic runs exact and each reported figure is
 * rounded half up once at the end. Customer totals are sums of listed prices, so they are exact.
 */
export function quote(card: QuoteInput, costs: Costs = DEFAULT_COSTS): Quote {
  const lines: QuoteLine[] = [];
  const aiPence = toPence(costs.ai);
  const servicePence = toPence(costs.service);

  if (card.mode === 'ecard') {
    const totalPence = toPence(DIGITAL.standalone);
    lines.push({ label: 'eCard, sent by link today', pence: totalPence });
    const paymentExact = costs.payPct * totalPence + toPence(costs.payFixed);
    const costExact = paymentExact + aiPence + servicePence;
    const exVat = exVatExact(totalPence);
    return {
      lines,
      totalPence,
      exVatPence: roundPence(exVat),
      cardPence: totalPence,
      deliveryPence: 0,
      moonpigPence: null,
      savingPence: null,
      moonpigNote: null,
      costs: {
        printPence: 0,
        deliveryPence: 0,
        paymentPence: roundPence(paymentExact),
        aiPence,
        servicePence,
        guaranteePence: 0,
        giftPence: 0,
        totalPence: roundPence(costExact),
      },
      contributionPence: roundPence(exVat - costExact),
      guarantee: false,
      firstCardFree: false,
      discountPence: 0,
    };
  }

  if (card.mode === 'pickup' && !pickupAllowed(card.size, card.finish)) {
    throw new Error('Pick-up is offered only for Regular cards in Classic or Signature');
  }
  const deliveryPounds = modePrice(card.mode, card.size);
  if (deliveryPounds == null)
    throw new Error(`Delivery mode ${card.mode} is not available for ${card.size} cards`);

  const listPence = toPence(PRICE[card.size][card.finish]);
  const firstCardFree =
    Boolean(card.firstCardFree) && firstCardFreeApplies(card.size, card.finish, card.mode);
  const discountPence =
    card.nextCardDiscount && !firstCardFree
      ? roundPence(listPence * GUARANTEE.nextCardDiscountPct)
      : 0;
  const cardPence = firstCardFree ? 0 : listPence - discountPence;
  const deliveryPence = toPence(deliveryPounds);
  const digitalPence = card.digital ? toPence(DIGITAL.paired) : 0;
  const giftPence = toPence(giftPrice(card.gift));

  lines.push({
    label: `${SIZES[card.size].label} ${FINISHES[card.finish].label} card`,
    pence: listPence,
  });
  if (firstCardFree) lines.push({ label: 'First card free', pence: -listPence });
  if (discountPence)
    lines.push({
      label: `${Math.round(GUARANTEE.nextCardDiscountPct * 100)}% off the card price (guarantee code)`,
      pence: -discountPence,
    });
  lines.push({
    label:
      card.mode === 'pickup' ? 'Pick-up at a partner shop, ready today' : MODES[card.mode].label,
    pence: deliveryPence,
  });
  if (digitalPence) lines.push({ label: 'Digital copy', pence: digitalPence });
  if (giftPence)
    lines.push({ label: GIFTS.find((g) => g.id === card.gift)?.label ?? 'Gift', pence: giftPence });

  const totalPence = cardPence + deliveryPence + digitalPence + giftPence;
  const exVat = exVatExact(totalPence);
  const guarantee = MODES[card.mode].guarantee;

  // Pick-up replaces the print cost with the partner payout plus the stock Dearly supplies.
  const printPence =
    card.mode === 'pickup'
      ? toPence(PICKUP.partnerPayout) + toPence(PICKUP.stock)
      : toPence(PRINT_COST[card.size][card.finish]);
  const deliveryCostPence =
    card.mode === 'pickup' ? 0 : toPence(modeCost(card.mode, card.size) ?? 0);
  const paymentExact = costs.payPct * totalPence + toPence(costs.payFixed);
  const guaranteePence = guarantee ? toPence(costs.guarantee) : 0;
  const giftCostExact = exVatExact(giftPence) * GIFT_COST_SHARE;
  const costExact =
    printPence +
    deliveryCostPence +
    paymentExact +
    aiPence +
    servicePence +
    guaranteePence +
    giftCostExact;

  let moonpigPence: number | null = null;
  let savingPence: number | null = null;
  let moonpigNote: string | null = null;
  if (card.size === 'regular') {
    if (card.mode === 'pickup') {
      moonpigNote = 'Moonpig has no same-day physical card.';
    } else {
      moonpigPence =
        toPence(MOONPIG.card) +
        toPence(card.mode === 'tracked' ? MOONPIG.tracked : MOONPIG.firstClass);
      savingPence = moonpigPence - (listPence + deliveryPence);
    }
  }

  return {
    lines,
    totalPence,
    exVatPence: roundPence(exVat),
    cardPence,
    deliveryPence,
    moonpigPence,
    savingPence,
    moonpigNote,
    costs: {
      printPence,
      deliveryPence: deliveryCostPence,
      paymentPence: roundPence(paymentExact),
      aiPence,
      servicePence,
      guaranteePence,
      giftPence: roundPence(giftCostExact),
      totalPence: roundPence(costExact),
    },
    contributionPence: roundPence(exVat - costExact),
    guarantee,
    firstCardFree,
    discountPence,
  };
}

/** Exact (unrounded) contribution in pence, for blends and break-even. */
export function contributionExact(card: QuoteInput, costs: Costs = DEFAULT_COSTS): number {
  const q = quote(card, costs);
  // Recompute exactly from the same inputs: the rounded quote figures are for display.
  const exVat = exVatExact(q.totalPence);
  const paymentExact = costs.payPct * q.totalPence + toPence(costs.payFixed);
  const giftCostExact = exVatExact(toPence(giftPrice(card.gift))) * GIFT_COST_SHARE;
  const costExact =
    q.costs.printPence +
    q.costs.deliveryPence +
    paymentExact +
    q.costs.aiPence +
    q.costs.servicePence +
    q.costs.guaranteePence +
    (card.mode === 'ecard' ? 0 : giftCostExact);
  return exVat - costExact;
}

/** Contribution for all nine size and finish combinations by advance post (tracked for Giant). */
export function contributionTable(costs: Costs = DEFAULT_COSTS): ContributionRow[] {
  const rows: ContributionRow[] = [];
  for (const size of Object.keys(SIZES) as Size[]) {
    for (const finish of Object.keys(FINISHES) as Finish[]) {
      const mode: PrintedMode = size === 'giant' ? 'tracked' : 'advance';
      const q = quote({ size, finish, mode }, costs);
      rows.push({
        size,
        finish,
        mode,
        pricePence: q.totalPence,
        exVatPence: q.exVatPence,
        costPence: q.costs.totalPence,
        contributionPence: q.contributionPence,
        marginPct:
          q.exVatPence === 0 ? 0 : Math.round((q.contributionPence / q.exVatPence) * 1000) / 10,
      });
    }
  }
  return rows;
}
