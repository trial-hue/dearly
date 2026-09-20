import {
  cleanStaffList,
  isoDate,
  priceBatch,
  schedulable,
  sendDateFor,
  staffRowsSummary,
  type BusinessFinish,
  type DeliveryOption,
  type StaffRow,
} from '@/domain';
import { prisma } from '@/server/db';
import { json } from '@/server/json';
import { DEMO_ORG_ID } from '@/server/seed/seedDemo';

import * as decisions from './decisionLog';

export async function getOrganisation() {
  return prisma.organisation.findUniqueOrThrow({
    where: { id: DEMO_ORG_ID },
    include: { batches: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function saveStaffText(text: string) {
  return prisma.organisation.update({
    where: { id: DEMO_ORG_ID },
    data: { staffText: text.slice(0, 20_000) },
  });
}

export interface ScheduleInput {
  option: DeliveryOption;
  finish: BusinessFinish;
  automate: boolean;
  giantForLeavers: boolean;
  rows: StaffRow[];
}

/** Clean with the strict parser and record the result. */
export async function cleanWithRules(text: string): Promise<StaffRow[]> {
  const rows = cleanStaffList(text);
  await saveStaffText(text);
  const s = staffRowsSummary(rows, 'posted');
  await decisions.record({
    actor: 'rule',
    job: 'clean_staff_list',
    summary: `Cleaned the staff list with the strict parser: ${s.scheduled} ready, ${s.flagged} flagged`,
  });
  return rows;
}

export async function scheduleBatch(input: ScheduleInput, today: Date) {
  const ready = input.rows.filter(
    (r) => schedulable(r, input.option) && sendDateFor(r, input.option, today),
  );
  if (ready.length === 0) return null;
  const giantCards = input.giantForLeavers
    ? ready.filter((r) => r.occasion === 'leaving').length
    : 0;
  const pricing = priceBatch(ready.length, {
    option: input.option,
    finish: input.finish,
    annualCards: ready.length,
    automate: input.automate,
    giantCards,
  });
  const dated = ready.map((r) => ({
    ...r,
    sendDate: isoDate(sendDateFor(r, input.option, today) as Date),
    giant: input.giantForLeavers && r.occasion === 'leaving',
  }));
  const earliest = dated.map((d) => d.sendDate).sort()[0] as string;
  await prisma.organisation.update({
    where: { id: DEMO_ORG_ID },
    data: { deliveryOption: input.option, plan: input.automate ? 'automate' : 'payg' },
  });
  const batch = await prisma.batch.create({
    data: {
      organisationId: DEMO_ORG_ID,
      sendDate: new Date(earliest),
      deliveryOption: input.option,
      finish: input.finish,
      cardCount: ready.length,
      giantCount: giantCards,
      pricePence: pricing.totalPence,
      contributionPence: pricing.contributionPence,
      rows: json(dated),
    },
  });
  for (const row of dated) {
    await prisma.job.create({
      data: {
        type: 'send_batch_card',
        payload: json({
          batchId: batch.id,
          name: row.name,
          occasion: row.occasion,
          giant: row.giant,
        }),
        runAt: new Date(row.sendDate),
      },
    });
  }
  await decisions.record({
    actor: 'person',
    job: 'business',
    summary: `Scheduled ${ready.length} staff cards by ${input.option === 'posted' ? 'home post' : 'office drop'} (${input.finish}${giantCards ? `, ${giantCards} Giant group card` : ''}); first send ${earliest}`,
  });
  return { batch, pricing };
}

export async function listBatches() {
  return prisma.batch.findMany({ orderBy: { createdAt: 'desc' } });
}
