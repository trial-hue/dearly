import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET ??= 'test-session-secret-for-unit-tests';

const { runJob } = await import('../gateway');
const { JOBS } = await import('../jobs');
const { MockProvider } = await import('../mockProvider');
const { extractJson } = await import('../provider');

const noSink = async () => undefined;

const proposalsInput = {
  sender: 'Alex',
  proposals: [
    {
      key: 'person_margaret|birthday|2026',
      firstName: 'Margaret Ellis',
      relationship: 'mother',
      occasion: 'birthday',
      date: '2026-10-09',
      daysLeft: 19,
      age: 60,
      milestone: true,
      current: {
        design: 'bignumber',
        size: 'large',
        finish: 'luxe',
        gift: 'flowers',
        message: 'Happy 60th birthday, Margaret. Love, Alex',
      },
      pastMessages: [],
    },
  ],
};

describe('runJob', () => {
  it('uses the fallback and records a rule decision when no provider is configured', async () => {
    const decisions: string[] = [];
    const r = await runJob('proposals', proposalsInput, {
      provider: null,
      sink: async (d) => void decisions.push(`${d.actor}:${d.job}`),
    });
    expect(r.by).toBe('rule');
    expect(r.result[0]?.key).toBe(proposalsInput.proposals[0]!.key);
    expect(decisions).toEqual(['rule:proposals']);
  });

  it('accepts valid mock answers and records an ai decision', async () => {
    const decisions: string[] = [];
    const r = await runJob('proposals', proposalsInput, {
      provider: new MockProvider(),
      sink: async (d) => void decisions.push(`${d.actor}:${d.job}`),
    });
    expect(r.by).toBe('ai');
    expect(r.result[0]?.message).toContain('Margaret');
    expect(decisions).toEqual(['ai:proposals']);
  });

  it('falls back when the provider returns invalid JSON or values outside the allowed lists', async () => {
    const bad = {
      name: 'Bad',
      completeJson: async () => ({
        raw: [
          {
            key: 'nope',
            message: 'x',
            design: 'zebra',
            size: 'huge',
            finish: 'glitter',
            gift: 'car',
            reason: 'no',
          },
        ],
        text: '',
        model: 'bad',
        inputTokens: 1,
        outputTokens: 1,
      }),
    };
    const r = await runJob('proposals', proposalsInput, { provider: bad, sink: noSink });
    expect(r.by).toBe('rule');
    expect(r.note).toContain('no valid proposals');
    const worse = {
      name: 'Worse',
      completeJson: async () => ({
        raw: 'not an array',
        text: '',
        model: 'bad',
        inputTokens: 1,
        outputTokens: 1,
      }),
    };
    expect((await runJob('proposals', proposalsInput, { provider: worse, sink: noSink })).by).toBe(
      'rule',
    );
  });

  it('downgrades a refund on an order that is not late', async () => {
    const provider = {
      name: 'Refunder',
      completeJson: async () => ({
        raw: { reply: 'Refunded', action: 'refund', orderId: 'o1' },
        text: '',
        model: 'x',
        inputTokens: 1,
        outputTokens: 1,
      }),
    };
    const r = await runJob(
      'agent_turn',
      {
        message: 'refund please',
        orders: [
          { id: 'o1', person: 'Dan Okafor', stage: 'posted', promised: '2026-09-30', late: false },
        ],
        turns: [],
      },
      { provider, sink: noSink },
    );
    expect(r.by).toBe('ai');
    expect(r.result.action).toBe('none');
  });

  it('rejects unsafe card fronts and keeps the stock design', async () => {
    const provider = {
      name: 'Evil',
      completeJson: async () => ({
        raw: { svg: '<svg onload="x()"><script>1</script><rect/></svg>' },
        text: '',
        model: 'x',
        inputTokens: 1,
        outputTokens: 1,
      }),
    };
    const r = await runJob(
      'card_front',
      {
        occasion: 'birthday',
        title: 'Happy birthday',
        firstName: 'Dan',
        age: 34,
        designHint: 'balloons',
      },
      { provider, sink: noSink },
    );
    expect(r.by).toBe('ai');
    expect(r.result.svg).not.toContain('script');
    expect(r.result.svg).not.toContain('onload');
  });

  it('never sends addresses or postcodes to the model', () => {
    const prompt = JOBS.proposals.buildPrompt(proposalsInput);
    expect(prompt).not.toMatch(/postcode|address|SY3|Abbey/i);
    const agentPrompt = JOBS.agent_turn.buildPrompt({
      message: 'hi',
      orders: [
        { id: 'o1', person: 'Dan Okafor', stage: 'posted', promised: '2026-09-30', late: false },
      ],
      turns: [],
    });
    expect(agentPrompt).not.toMatch(/postcode|address/i);
    for (const def of Object.values(JOBS)) expect(def.buildPrompt).toBeTypeOf('function');
  });

  it('extracts JSON from fenced and wrapped replies', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Here you go: [1,2] thanks')).toEqual([1, 2]);
    expect(() => extractJson('nothing here')).toThrow();
  });
});
