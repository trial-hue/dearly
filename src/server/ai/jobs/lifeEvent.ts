import { z } from 'zod';

import { detectLifeEvent, type LifeEventPerson, type LifeEventResult } from '@/domain';

import { PROMPT_HEAD, RULES_LINE, defineJob } from './types';

export interface LifeEventInput {
  text: string;
  people: LifeEventPerson[];
}

const Output = z.object({
  personId: z.string().nullable(),
  action: z.enum(['pause', 'none']),
  reason: z.string().max(120),
});

export const lifeEventJob = defineJob<LifeEventInput, LifeEventResult>({
  tier: 'quick',
  maxTokens: 300,
  buildPrompt(input) {
    return [
      `${PROMPT_HEAD} The customer has told us something changed in a relationship. Decide whether to pause cards for one person.`,
      `${RULES_LINE} Pause for a bereavement, a separation or divorce, an estrangement, or any reason a card would be unwelcome. Otherwise choose "none". Match the person by first name or relationship. Never pause more than one person; if unsure, choose "none".`,
      `Allowed values: personId one of ${JSON.stringify(input.people.map((p) => p.id))} or null; action "pause" or "none".`,
      `Data: ${JSON.stringify({ text: input.text.slice(0, 1000), people: input.people.map((p) => ({ id: p.id, firstName: p.name.split(' ')[0], name: p.name, relationship: p.relationship })) })}`,
      'Reply with only JSON in this shape: {"personId": string|null, "action": "pause"|"none", "reason": string}. Example: {"personId":"person_peter","action":"pause","reason":"Bereavement"}',
    ].join('\n');
  },
  schema: Output,
  validate(output, input) {
    if (output.personId && !input.people.some((p) => p.id === output.personId))
      throw new Error('unknown person');
    if (output.action === 'pause' && !output.personId) return { ...output, action: 'none' };
    return output;
  },
  fallback(input) {
    return detectLifeEvent(input.text, input.people);
  },
  summary(output, input) {
    const person = input.people.find((p) => p.id === output.personId);
    return output.action === 'pause'
      ? `Life event: pause cards for ${person?.name ?? 'someone'} (${output.reason})`
      : `Life event read: no pause needed`;
  },
});
