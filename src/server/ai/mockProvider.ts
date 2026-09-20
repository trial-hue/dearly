import type { AiProvider, CompletionArgs, CompletionResult } from './provider';

type Answer = (input: unknown) => unknown;

/**
 * Canned but valid answers per job, derived from the job input, for unit and end-to-end tests.
 * Nothing leaves the process.
 */
const answers: Record<string, Answer> = {
  proposals: (input) => {
    const i = input as {
      proposals: {
        key: string;
        firstName: string;
        occasion: string;
        current: { design: string; size: string; finish: string; gift: string };
      }[];
    };
    return i.proposals.map((p) => ({
      key: p.key,
      message: `Thinking of you for your ${p.occasion.replace(/_/g, ' ')}, ${p.firstName}. With love from the mock AI. Alex`,
      design: p.current.design,
      size: p.current.size,
      finish: p.current.finish,
      gift: p.current.gift,
      reason: 'Mock AI kept the rules-based options',
    }));
  },
  rewrite_message: (input) => {
    const i = input as { firstName: string; occasion: string };
    return {
      message: `A fresh line for ${i.firstName} on the ${i.occasion.replace(/_/g, ' ')}, written by the mock AI. Love, Alex`,
    };
  },
  import_people: (input) => {
    const i = input as { text: string };
    return i.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [name] = line.split(',');
        return {
          name: (name ?? line).trim(),
          relationship: 'friend',
          occasion: 'birthday',
          month: 6,
          day: 15,
          year: null,
        };
      });
  },
  life_event: (input) => {
    const i = input as {
      text: string;
      people: { id: string; name: string; relationship: string }[];
    };
    const lower = i.text.toLowerCase();
    const hit =
      i.people.find((p) => lower.includes(p.name.split(' ')[0]?.toLowerCase() ?? '\u0000')) ??
      i.people.find((p) => lower.includes(p.relationship.toLowerCase()));
    const pause = /passed|died|split|separat|divorc/.test(lower);
    return {
      personId: hit?.id ?? null,
      action: hit && pause ? 'pause' : 'none',
      reason: pause ? 'Life event reported (mock AI)' : 'No change needed (mock AI)',
    };
  },
  clean_staff_list: (input) => {
    const i = input as { text: string };
    return i.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          name: parts[0] ?? `Row ${idx + 1}`,
          date: '1990-01-15',
          occasion: 'birthday',
          postcode: parts[3] && /^[A-Z]{1,2}\d/i.test(parts[3]) ? parts[3] : '',
          issue: parts[3] ? null : 'missing postcode (mock AI)',
        };
      });
  },
  read_florist_order: () => ({
    recipient: 'Mrs J Sharma',
    relationship: 'mother',
    occasion: 'birthday',
    date: null,
    age: 70,
  }),
  agent_turn: (input) => {
    const i = input as { message: string; orders: { id: string; person: string; late: boolean }[] };
    const lower = i.message.toLowerCase();
    const named = i.orders.find((o) =>
      lower.includes((o.person.split(' ')[0] ?? '').toLowerCase()),
    );
    const order = named ?? i.orders[0] ?? null;
    const late = /n't arrived|not arrived|late|missing|lost/.test(lower);
    return {
      reply: order
        ? `Mock AI here: I have looked at the card for ${order.person}${late ? ' and arranged a tracked reprint plus an eCard for the day' : ''}.`
        : 'Mock AI here: which card is this about?',
      action: order && late ? 'reprint' : 'none',
      orderId: order?.id ?? null,
    };
  },
  card_front: () => ({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 370"><rect width="264" height="370" fill="#FFFDF7"/><circle cx="132" cy="150" r="60" fill="#2B55C6"/><text x="132" y="300" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#1F1A15">Mock AI front</text></svg>',
  }),
};

export class MockProvider implements AiProvider {
  readonly name = 'Mock AI';
  async completeJson(args: CompletionArgs): Promise<CompletionResult> {
    const answer = answers[args.job];
    if (!answer) throw new Error(`mock has no answer for ${args.job}`);
    const raw = answer(args.input);
    return {
      raw,
      text: JSON.stringify(raw),
      model: 'mock',
      inputTokens: Math.ceil(args.prompt.length / 4),
      outputTokens: 120,
    };
  }
}
