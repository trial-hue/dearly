import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET ??= 'test-session-secret-for-unit-tests';

const { runJob } = await import('../gateway');
const { JOBS } = await import('../jobs');
type JobName = keyof typeof JOBS;
const { MockProvider } = await import('../mockProvider');
const { SVG_MAX_BYTES, sampleFloristOrder, seedStaffText } = await import('@/domain');

const today = new Date(2026, 8, 23);
const noSink = async () => undefined;

/** One realistic input per job, the same shape the routes build. */
const INPUTS: Record<JobName, unknown> = {
  proposals: {
    sender: 'Alex',
    proposals: [
      {
        key: 'person_dan|birthday|2026',
        firstName: 'Dan Okafor',
        relationship: 'friend',
        occasion: 'birthday',
        date: '2026-09-29',
        daysLeft: 9,
        age: 34,
        milestone: false,
        current: {
          design: 'balloons',
          size: 'regular',
          finish: 'signature',
          gift: 'none',
          message: 'Happy birthday, Dan. Love, Alex',
        },
        pastMessages: [
          'Happy birthday, Dan. Hope the day is full of the people and things you love. Love, Alex',
        ],
      },
    ],
  },
  rewrite_message: {
    sender: 'Alex',
    firstName: 'Dan',
    relationship: 'friend',
    occasion: 'birthday',
    age: 34,
    current: 'Happy birthday, Dan. Love, Alex',
  },
  import_people: {
    text: 'Jo Ellis, sister, birthday 4 March 1990\nRavi Sharma, friend, birthday 12/07',
  },
  life_event: {
    text: 'Uncle Peter passed away in June',
    people: [
      { id: 'person_peter', name: 'Peter Ellis', relationship: 'uncle' },
      { id: 'person_dan', name: 'Dan Okafor', relationship: 'friend' },
    ],
  },
  clean_staff_list: { text: seedStaffText(today) },
  read_florist_order: { text: sampleFloristOrder(today) },
  agent_turn: {
    message: "my card for Priya hasn't arrived",
    orders: [
      { id: 'ord_1', person: 'Priya and Tom', stage: 'posted', promised: '2026-09-22', late: true },
      { id: 'ord_2', person: 'Dan Okafor', stage: 'printed', promised: '2026-09-27', late: false },
    ],
    turns: [],
  },
  card_front: {
    occasion: 'birthday',
    title: 'Happy birthday',
    firstName: 'Dan',
    age: 34,
    designHint: 'balloons',
  },
};

const jobs = Object.keys(JOBS) as JobName[];

describe('G1 every job answers with the mock provider and with no provider', () => {
  it.each(jobs)('%s', async (job) => {
    const input = INPUTS[job] as never;
    const withMock = await runJob(job, input, { provider: new MockProvider(), sink: noSink });
    const withNone = await runJob(job, input, { provider: null, sink: noSink });
    expect(withMock.by).toBe('ai');
    expect(withNone.by).toBe('rule');
    expect(withNone.provider).toBeNull();
    // Both results are valid for the job's own schema (the fallback shape equals the AI shape).
    const def = JOBS[job] as unknown as {
      schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } };
    };
    for (const r of [withMock.result, withNone.result]) {
      const parsed = def.schema.safeParse(r);
      expect(parsed.success, `${job}: ${JSON.stringify(parsed.error ?? '').slice(0, 300)}`).toBe(
        true,
      );
    }
  });

  it('F1 and E1: the florist order and the staff list read the same with and without AI', async () => {
    const florist = INPUTS.read_florist_order as never;
    const a = await runJob('read_florist_order', florist, {
      provider: new MockProvider(),
      sink: noSink,
    });
    const b = await runJob('read_florist_order', florist, { provider: null, sink: noSink });
    for (const r of [a.result, b.result]) {
      expect(r.recipient).toBe('Mrs J Sharma');
      expect(r.relationship).toBe('mother');
      expect(r.occasion).toBe('birthday');
      expect(r.age).toBe(70);
      expect(r.date).toBe('2026-10-12');
    }
    const staff = INPUTS.clean_staff_list as never;
    for (const provider of [new MockProvider(), null]) {
      const r = await runJob('clean_staff_list', staff, { provider, sink: noSink });
      expect(r.result).toHaveLength(10);
      for (const row of r.result)
        expect(row.issue != null || (row.postcode !== '' && row.monthDay !== null)).toBe(true);
    }
  });
});

describe('G2 schema validation and fallbacks', () => {
  const answer = (raw: unknown) => ({
    name: 'Test',
    completeJson: async () => ({
      raw,
      text: typeof raw === 'string' ? raw : JSON.stringify(raw),
      model: 'x',
      inputTokens: 1,
      outputTokens: 1,
    }),
  });
  it('falls back on invalid JSON for every job without throwing', async () => {
    const broken = {
      name: 'Broken',
      completeJson: async () => {
        throw new Error('not json {');
      },
    };
    for (const job of jobs) {
      const r = await runJob(job, INPUTS[job] as never, { provider: broken, sink: noSink });
      expect(r.by).toBe('rule');
    }
  });
  it('falls back on unknown enum values', async () => {
    const r = await runJob('agent_turn', INPUTS.agent_turn as never, {
      provider: answer({ reply: 'ok', action: 'delete_account', orderId: 'ord_1' }),
      sink: noSink,
    });
    expect(r.by).toBe('rule');
    const l = await runJob('life_event', INPUTS.life_event as never, {
      provider: answer({ personId: 'person_peter', action: 'erase', reason: 'x' }),
      sink: noSink,
    });
    expect(l.by).toBe('rule');
  });
  it('drops oversized or unsafe SVG fronts and keeps the stock design', async () => {
    const big = await runJob('card_front', INPUTS.card_front as never, {
      provider: answer({
        svg: `<svg xmlns="http://www.w3.org/2000/svg">${'<rect/>'.repeat(SVG_MAX_BYTES / 7)}</svg>`,
      }),
      sink: noSink,
    });
    expect(big.result.svg).toBeNull();
    const unsafe = await runJob('card_front', INPUTS.card_front as never, {
      provider: answer({
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><script>1</script></foreignObject><a href="https://x"/></svg>',
      }),
      sink: noSink,
    });
    expect(unsafe.result.svg ?? '').not.toMatch(/script|foreignObject|href/i);
  });
});

describe('G3 prompts carry no address, postcode, email, phone or surname field', () => {
  const FIELD = /"(address|postcode|postCode|email|phone|surname|lastName|last_name)"\s*:/i;
  const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
  const PHONE = /\b(?:\+44|0)\d{2,4}[ -]?\d{3,4}[ -]?\d{3,4}\b/;
  const POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/;
  it.each(jobs)('%s', (job) => {
    const def = JOBS[job] as unknown as { buildPrompt: (i: unknown) => string };
    const prompt = def.buildPrompt(INPUTS[job]);
    // Field names are checked on the data the model is given (the "Data:" line); the reply-shape
    // instruction may name an output key such as "postcode" that carries a token, never a value.
    const data = prompt
      .split('\n')
      .filter((l) => l.startsWith('Data:'))
      .join('\n');
    expect(data).not.toBe('');
    expect(data).not.toMatch(FIELD);
    expect(prompt).not.toMatch(EMAIL);
    expect(prompt).not.toMatch(PHONE);
    expect(prompt).not.toMatch(POSTCODE);
  });
  it('sends first names only to the drafting, rewrite and support jobs', () => {
    const p = (JOBS.proposals as unknown as { buildPrompt: (i: unknown) => string }).buildPrompt(
      INPUTS.proposals,
    );
    expect(p).not.toContain('Okafor');
    const a = (JOBS.agent_turn as unknown as { buildPrompt: (i: unknown) => string }).buildPrompt(
      INPUTS.agent_turn,
    );
    expect(a).not.toContain('Okafor');
  });
});
