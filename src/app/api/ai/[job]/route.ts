import { z } from 'zod';

import { isOccasionType, type CardSpec } from '@/domain';
import { env } from '@/env';
import { aiStatus, runJob } from '@/server/ai/gateway';
import { isJobName } from '@/server/ai/jobs';
import { getAccountId } from '@/server/auth';
import { now } from '@/server/clock';
import { prisma } from '@/server/db';
import { ok, problem, readJson } from '@/server/http';
import { json } from '@/server/json';
import { rateLimit } from '@/server/rateLimit';
import { saveStaffText } from '@/server/services/business';
import { listPeople, pausePerson } from '@/server/services/people';
import {
  SENDER,
  applyAiProposal,
  getProposal,
  openProposalsForAi,
  updateCard,
} from '@/server/services/proposals';

export const dynamic = 'force-dynamic';

const KeyBody = z.object({ key: z.string().min(1) });
const TextBody = z.object({ text: z.string().min(1).max(20_000) });

/** One AI job through the gateway. Falls back to rules when no provider is configured. */
export async function POST(req: Request, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params;
  if (!isJobName(job) || job === 'agent_turn') return problem(404, 'Unknown job');
  const accountId = await getAccountId();
  const limit = rateLimit(`ai:${accountId}`, env.RATE_LIMIT_AI_PER_MIN);
  if (!limit.ok)
    return problem(429, 'Too many AI requests', `Try again in ${limit.retryAfterSec} seconds`);
  const today = now();
  const status = aiStatus();

  switch (job) {
    case 'proposals': {
      const open = await openProposalsForAi(accountId, today);
      if (open.length === 0) return ok({ by: 'rule', count: 0, provider: status.provider });
      const r = await runJob('proposals', { sender: SENDER, proposals: open });
      if (r.by === 'ai') {
        for (const item of r.result) {
          await applyAiProposal(
            item.key,
            {
              message: item.message,
              design: item.design as CardSpec['design'],
              size: item.size as CardSpec['size'],
              finish: item.finish as CardSpec['finish'],
              gift: item.gift as CardSpec['gift'],
              reason: item.reason,
            },
            today,
          );
        }
      }
      return ok({ by: r.by, count: r.result.length, provider: r.provider, note: r.note });
    }
    case 'rewrite_message': {
      const body = await readJson(req, KeyBody);
      if (!body.ok) return body.response;
      const view = await getProposal(body.data.key, today);
      if (!view) return problem(404, 'Proposal not found');
      const r = await runJob('rewrite_message', {
        sender: SENDER,
        firstName: view.person.name.split(' ')[0] ?? view.person.name,
        relationship: view.person.relationship,
        occasion: view.occasionType,
        age: view.age,
        current: view.card.message,
      });
      await prisma.proposal.update({
        where: { key: view.key },
        data: { cardSpec: json({ ...view.card, message: r.result.message }), messageBy: r.by },
      });
      return ok({ view: await getProposal(view.key, today), by: r.by, note: r.note });
    }
    case 'import_people': {
      const body = await readJson(req, TextBody);
      if (!body.ok) return body.response;
      const r = await runJob('import_people', { text: body.data.text });
      return ok({ people: r.result, by: r.by, note: r.note });
    }
    case 'life_event': {
      const body = await readJson(req, TextBody);
      if (!body.ok) return body.response;
      const people = await listPeople(accountId, today);
      const r = await runJob('life_event', {
        text: body.data.text,
        people: people.map((p) => ({ id: p.id, name: p.name, relationship: p.relationship })),
      });
      const person = people.find((p) => p.id === r.result.personId) ?? null;
      let applied = false;
      if (r.result.action === 'pause' && person && !person.pausedReason) {
        await pausePerson(person.id, r.result.reason, r.by, today);
        applied = true;
      }
      return ok({
        result: r.result,
        by: r.by,
        personName: person?.name ?? null,
        alreadyPaused: Boolean(person?.pausedReason),
        applied,
        note: r.note,
      });
    }
    case 'clean_staff_list': {
      const body = await readJson(req, TextBody);
      if (!body.ok) return body.response;
      const r = await runJob('clean_staff_list', { text: body.data.text });
      await saveStaffText(body.data.text);
      return ok({ rows: r.result, by: r.by, note: r.note });
    }
    case 'read_florist_order': {
      const body = await readJson(req, TextBody);
      if (!body.ok) return body.response;
      const r = await runJob('read_florist_order', { text: body.data.text });
      return ok({ reading: r.result, by: r.by, note: r.note });
    }
    case 'card_front': {
      const body = await readJson(req, KeyBody);
      if (!body.ok) return body.response;
      const view = await getProposal(body.data.key, today);
      if (!view) return problem(404, 'Proposal not found');
      const r = await runJob('card_front', {
        occasion: isOccasionType(view.occasionType) ? view.occasionType : 'birthday',
        title: view.title,
        firstName: view.person.name.split(' ')[0] ?? view.person.name,
        age: view.age,
        designHint: view.card.design,
      });
      let applied = false;
      if (r.result.svg) {
        await updateCard(view.key, { customFront: { kind: 'svg', svg: r.result.svg } }, today);
        applied = true;
      }
      return ok({ view: await getProposal(view.key, today), by: r.by, applied, note: r.note });
    }
    default:
      return problem(404, 'Unknown job');
  }
}
