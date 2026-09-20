import {
  DEFAULT_COSTS,
  DIGITAL,
  GIFTS,
  GIFT_COST_SHARE,
  MODES,
  MOONPIG,
  PRICE,
  PRINT_COST,
  SIZES,
  FINISHES,
} from './constants';
import { modeCost, modePrice } from './delivery';
import { exVat, toPence } from './money';
import type {
  Costs,
  ContributionRow,
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
}

export function giftPrice(gift: GiftId | undefined): number {
  return GIFTS.find((g) => g.id === gift)?.price ?? 0;
}

/**
 * Price and cost of one card, in integer pence.
 * Printed total = card + delivery + digital copy + gift. eCard-only total = 79p.
 */
export function quote(card: QuoteInput, costs: Costs = DEFAULT_COSTS): Quote {
  const lines: QuoteLine[] = [];
  if (card.mode === 'ecard') {
    const totalPence = toPence(DIGITAL.standalone);
    lines.push({ label: 'eCard, sent by link today', pence: totalPence });
    const paymentPence = Math.round(costs.payPct * totalPence) + toPence(costs.payFixed);
    const aiPence = toPence(costs.ai);
    const servicePence = toPence(costs.service);
    const costTotal = paymentPence + aiPence + servicePence;
    const exVatPence = exVat(totalPence);
    return {
      lines,
      totalPence,
      exVatPence,
      cardPence: totalPence,
      deliveryPence: 0,
      moonpigPence: null,
      savingPence: null,
      moonpigNote: null,
      costs: {
        printPence: 0,
        deliveryPence: 0,
        paymentPence,
        aiPence,
        servicePence,
        guaranteePence: 0,
        giftPence: 0,
        totalPence: costTotal,
      },
      contributionPence: exVatPence - costTotal,
      guarantee: false,
    };
  }

  const deliveryPounds = modePrice(card.mode, card.size);
  const deliveryCostPounds = modeCost(card.mode, card.size);
  if (deliveryPounds == null || deliveryCostPounds == null) {
    throw new Error(`Delivery mode ${card.mode} is not available for ${card.size} cards`);
  }
  const cardPence = toPence(PRICE[card.size][card.finish]);
  const deliveryPence = toPence(deliveryPounds);
  const digitalPence = card.digital ? toPence(DIGITAL.paired) : 0;
  const giftPence = toPence(giftPrice(card.gift));

  lines.push({
    label: `${SIZES[card.size].label} ${FINISHES[card.finish].label} card`,
    pence: cardPence,
  });
  lines.push({
    label: card.mode === 'pickup' ? 'Pick-up at a partner shop' : MODES[card.mode].label,
    pence: deliveryPence,
  });
  if (digitalPence) lines.push({ label: 'Digital copy', pence: digitalPence });
  if (giftPence)
    lines.push({ label: GIFTS.find((g) => g.id === card.gift)?.label ?? 'Gift', pence: giftPence });

  const totalPence = cardPence + deliveryPence + digitalPence + giftPence;
  const exVatPence = exVat(totalPence);
  const guarantee = MODES[card.mode].guarantee;

  const printPence = toPence(PRINT_COST[card.size][card.finish]);
  const deliveryCostPence = toPence(deliveryCostPounds);
  const paymentPence = Math.round(costs.payPct * totalPence) + toPence(costs.payFixed);
  const aiPence = toPence(costs.ai);
  const servicePence = toPence(costs.service);
  const guaranteePence = guarantee ? toPence(costs.guarantee) : 0;
  const giftCostPence = Math.round((giftPence / 1.2) * GIFT_COST_SHARE);
  const costTotal =
    printPence +
    deliveryCostPence +
    paymentPence +
    aiPence +
    servicePence +
    guaranteePence +
    giftCostPence;

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
      savingPence = moonpigPence - (cardPence + deliveryPence);
    }
  }

  return {
    lines,
    totalPence,
    exVatPence,
    cardPence,
    deliveryPence,
    moonpigPence,
    savingPence,
    moonpigNote,
    costs: {
      printPence,
      deliveryPence: deliveryCostPence,
      paymentPence,
      aiPence,
      servicePence,
      guaranteePence,
      giftPence: giftCostPence,
      totalPence: costTotal,
    },
    contributionPence: exVatPence - costTotal,
    guarantee,
  };
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
