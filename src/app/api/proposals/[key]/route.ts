import { z } from 'zod';

import { DigitalExtrasSchema } from '@/domain';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { ok, problem, readJson } from '@/server/http';
import { confirmAddress } from '@/server/services/people';
import {
  applyGuaranteeCode,
  approveProposal,
  getProposal,
  rewriteWithRules,
  setProposalDate,
  skipProposal,
  updateCard,
} from '@/server/services/proposals';

export const dynamic = 'force-dynamic';

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('edit'), patch: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal('approve'), extras: DigitalExtrasSchema.optional() }),
  z.object({ action: z.literal('apply_code'), code: z.string().min(4).max(24) }),
  z.object({ action: z.literal('skip') }),
  z.object({ action: z.literal('confirm_address') }),
  z.object({ action: z.literal('rewrite_rules') }),
  z.object({ action: z.literal('set_date'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
]);

type Params = { params: Promise<{ key: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { key } = await params;
  const view = await getProposal(decodeURIComponent(key), now());
  return view ? ok(view) : problem(404, 'Proposal not found');
}

export async function PATCH(req: Request, { params }: Params) {
  const { key: raw } = await params;
  const key = decodeURIComponent(raw);
  const body = await readJson(req, Body);
  if (!body.ok) return body.response;
  const accountId = await getAccountId();
  const today = now();
  switch (body.data.action) {
    case 'edit': {
      try {
        const view = await updateCard(key, body.data.patch, today);
        return view ? ok(view) : problem(404, 'Proposal not found');
      } catch (err) {
        return problem(400, 'Invalid card', err instanceof Error ? err.message : undefined);
      }
    }
    case 'approve': {
      const result = await approveProposal(key, accountId, today, body.data.extras);
      if (!result.ok) {
        const messages: Record<string, string> = {
          not_found: 'Proposal not found',
          not_proposed: 'This proposal was already decided',
          address_stale: 'Confirm the address first: it was last checked over a year ago',
          paused: 'Cards for this person are paused',
        };
        return problem(
          result.reason === 'not_found' ? 404 : 409,
          messages[result.reason] ?? 'Cannot approve',
          result.reason,
        );
      }
      return ok(result);
    }
    case 'apply_code': {
      try {
        const view = await applyGuaranteeCode(key, body.data.code, accountId, today);
        return view ? ok(view) : problem(404, 'Proposal not found');
      } catch (err) {
        return problem(400, 'Code not applied', err instanceof Error ? err.message : undefined);
      }
    }
    case 'skip':
      return (await skipProposal(key))
        ? ok({ skipped: true })
        : problem(409, 'This proposal was already decided');
    case 'confirm_address': {
      const view = await getProposal(key, today);
      if (!view) return problem(404, 'Proposal not found');
      await confirmAddress(view.personId, today);
      return ok(await getProposal(key, today));
    }
    case 'rewrite_rules': {
      const view = await rewriteWithRules(key, today);
      return view ? ok(view) : problem(404, 'Proposal not found');
    }
    case 'set_date': {
      try {
        const view = await setProposalDate(key, body.data.date, today);
        return view ? ok(view) : problem(409, 'This proposal was already decided');
      } catch (err) {
        return problem(400, 'Cannot use that date', err instanceof Error ? err.message : undefined);
      }
    }
  }
}
