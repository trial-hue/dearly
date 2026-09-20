import { firstName } from './templates';
import type { AgentAction } from './types';

export interface AgentOrderView {
  id: string;
  person: string;
  stage: string;
  promised: string;
  late: boolean;
  damaged?: boolean;
}

export interface AgentTurnResult {
  reply: string;
  action: AgentAction;
  orderId: string | null;
}

/** Find the order a message is about by the recipient's first name, else the most recent open one. */
export function matchOrder(
  message: string,
  orders: readonly AgentOrderView[],
): AgentOrderView | null {
  const lower = message.toLowerCase();
  const named = orders.find((o) => {
    const first = firstName(o.person).toLowerCase();
    return first.length > 2 && new RegExp(`\\b${first}\\b`).test(lower);
  });
  if (named) return named;
  const open = orders.find((o) => o.stage !== 'delivered' && o.stage !== 'collected');
  return open ?? orders[0] ?? null;
}

/** Keyword rules for a support turn. Refunds only when the order is late or damaged. */
export function agentFallback(message: string, orders: readonly AgentOrderView[]): AgentTurnResult {
  const lower = message.toLowerCase();
  const order = matchOrder(message, orders);
  const who = order ? firstName(order.person) : 'your recipient';

  if (/passed away|died|bereave|funeral|distress|upset|grie/.test(lower)) {
    return {
      reply: `I am so sorry to hear that. I have passed this to a person on the team, who will be in touch today. Nothing else will be sent for ${who} in the meantime.`,
      action: 'escalate',
      orderId: order?.id ?? null,
    };
  }
  if (!order) {
    return {
      reply: 'I cannot find an order for that name. Which card is this about?',
      action: 'none',
      orderId: null,
    };
  }
  if (/damaged|wrong|torn|crease|misprint|spelling|typo/.test(lower)) {
    return {
      reply: `Sorry about that. I have arranged a tracked reprint for ${who} at no charge, and an eCard will go on the day so nothing is missed.`,
      action: 'reprint',
      orderId: order.id,
    };
  }
  if (/refund|money back/.test(lower)) {
    if (order.late || order.damaged) {
      return {
        reply: `That is covered by the delivery guarantee. I have refunded the order in full; it will show within a few days.`,
        action: 'refund',
        orderId: order.id,
      };
    }
    return {
      reply: `The card for ${who} is still on track for ${order.promised}, so it is not eligible for a refund yet. If it has not arrived by then, message me and I will refund it straight away.`,
      action: 'none',
      orderId: order.id,
    };
  }
  if (/not arrived|hasn'?t arrived|has not arrived|late|missing|where is|lost/.test(lower)) {
    return {
      reply: `Sorry the card for ${who} has not arrived. I have sent a tracked reprint today and scheduled an eCard for the day itself, so ${who} will not miss out.`,
      action: 'reprint',
      orderId: order.id,
    };
  }
  if (/faster|sooner|upgrade|tracked|next day/.test(lower)) {
    return {
      reply: `I have upgraded the card for ${who} to tracked next-day delivery.`,
      action: 'upgrade',
      orderId: order.id,
    };
  }
  if (/ecard|e-card|today|right now/.test(lower)) {
    return {
      reply: `I have sent an eCard to ${who} by link right now.`,
      action: 'send_ecard',
      orderId: order.id,
    };
  }
  return {
    reply: `The card for ${who} is at the ${order.stage.replace(/_/g, ' ')} stage and promised for ${order.promised}. Tell me if it is late, damaged, or you would like it faster.`,
    action: 'none',
    orderId: order.id,
  };
}
