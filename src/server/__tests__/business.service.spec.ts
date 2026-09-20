import { beforeEach, describe, expect, it } from 'vitest';

import { seedStaffText } from '@/domain';
import { runJob } from '@/server/ai/gateway';
import { MockProvider } from '@/server/ai/mockProvider';
import { cleanWithRules, scheduleBatch } from '@/server/services/business';
import { operationsScreen } from '@/server/services/operations';

import { DEMO_ACCOUNT_ID, TODAY, resetDemo } from './helpers';

describe('E. business segment', () => {
  beforeEach(() => resetDemo());

  it('E1 the messy seeded staff list cleans to ten rows, each valid or flagged, with and without AI', async () => {
    const rules = await cleanWithRules(seedStaffText(TODAY));
    expect(rules).toHaveLength(10);
    expect(rules.filter((r) => r.issue).length).toBe(3);
    const ai = await runJob(
      'clean_staff_list',
      { text: seedStaffText(TODAY) },
      { provider: new MockProvider() },
    );
    expect(ai.by).toBe('ai');
    expect(ai.result).toHaveLength(10);
    for (const row of ai.result)
      expect(row.issue != null || (row.postcode !== '' && row.monthDay !== null)).toBe(true);
  });

  it('E5 scheduling creates a batch that appears on Operations with its contribution', async () => {
    const rows = await cleanWithRules(seedStaffText(TODAY));
    const r = await scheduleBatch(
      { option: 'officeDrop', finish: 'signature', automate: false, giantForLeavers: false, rows },
      TODAY,
    );
    expect(r).not.toBeNull();
    expect(r!.batch.cardCount).toBe(8);
    expect(r!.batch.pricePence).toBe(8 * 230);
    expect(r!.batch.contributionPence).toBe(r!.pricing.contributionPence);
    expect(r!.pricing.contributionPerCardPence).toBe(107);
    const ops = await operationsScreen(DEMO_ACCOUNT_ID, TODAY);
    const shown = ops.batches.find((b) => b.id === r!.batch.id);
    expect(shown).toBeDefined();
    expect(shown!.contributionPence).toBe(r!.batch.contributionPence);
    expect(ops.counters.batches).toBe(1);
  });
});
