import { z } from 'zod';

import {
  AGENT_ACTIONS,
  agentFallback,
  firstName,
  type AgentOrderView,
  type AgentTurnResult,
} from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface AgentInput {
  message: string;
  orders: AgentOrderView[];
  turns: { role: 'user' | 'assistant'; content: string }[];
}

const Output = z.object({
  reply: z.string().min(1).max(600),
  action: z.enum(AGENT_ACTIONS),
  orderId: z.string().nullable(),
});

export const agentTurnJob = defineJob<AgentInput, AgentTurnResult>({
  tier: 'quick',
  maxTokens: 500,
  buildPrompt(input) {
    return [
      `${PROMPT_HEAD} You are the help agent. Answer the customer's latest message and pick one action on one order.`,
      `${RULES_LINE} Be brief, warm and concrete. Say what you have done, never what you will try. You may refund only an order that is late or damaged. Choose "reprint" when a card has not arrived or is damaged (it also sends an eCard on the day), "upgrade" to make an open order tracked, "send_ecard" for an immediate eCard, "escalate" for bereavement or distress, otherwise "none". Never promise anything outside these actions. Do not state that you are a person.`,
      `Allowed values: action in ${JSON.stringify(AGENT_ACTIONS)}; orderId one of ${JSON.stringify(input.orders.map((o) => o.id))} or null.`,
      // First names only: the model never sees a surname, address or postcode.
      `Data: ${JSON.stringify({ orders: input.orders.map((o) => ({ ...o, person: firstName(o.person) })), recentTurns: input.turns.slice(-6), message: input.message.slice(0, 1000) })}`,
      'Reply with only JSON in this shape: {"reply": string, "action": string, "orderId": string|null}. Example: {"reply":"Sorry the card for Dan has not arrived. I have sent a tracked reprint today and an eCard will go on the day.","action":"reprint","orderId":"ord_123"}',
    ].join('\n');
  },
  schema: Output,
  validate(output, input) {
    const order = output.orderId ? input.orders.find((o) => o.id === output.orderId) : null;
    if (output.orderId && !order) throw new Error('unknown order');
    if (output.action === 'refund' && !(order?.late || order?.damaged))
      return { ...output, action: 'none' };
    if (output.action !== 'none' && output.action !== 'escalate' && !order)
      return { ...output, action: 'none' };
    return output;
  },
  fallback(input) {
    return agentFallback(input.message, input.orders);
  },
  summary(output) {
    return output.action === 'none'
      ? 'Answered a support message'
      : `Support action: ${output.action.replace('_', ' ')}`;
  },
});
