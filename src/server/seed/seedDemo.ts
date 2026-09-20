import type { Prisma, PrismaClient } from '@prisma/client';

import {
  DEFAULT_COSTS,
  PRINTERS,
  RULES,
  addDays,
  addYears,
  isoDate,
  monthDayOf,
  quote,
  seedStaffText,
  startOfDay,
  type CardSpec,
} from '@/domain';

export const DEMO_ACCOUNT_ID = 'acct_demo';
export const DEMO_ORG_ID = 'org_demo';
export const FLORIST_PARTNER_ID = 'partner_bloom';
export const SEED_SLUGS = {
  danDelivered: 'seed-dan-birthday-delivered-2025',
  priyaPosted: 'seed-priya-thankyou-posted-card',
} as const;

function json<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

interface SeedPerson {
  id: string;
  name: string;
  relationship: string;
  postcode: string;
  address: string;
  addrCheckedDaysAgo: number;
  paused?: { reason: string; daysAgo: number };
  occasion: {
    type: string;
    daysFromToday?: number;
    age?: number;
    feast?: boolean;
    adhoc?: boolean;
  };
  note?: string;
}

const PEOPLE: SeedPerson[] = [
  {
    id: 'person_margaret',
    name: 'Margaret Ellis',
    relationship: 'mother',
    postcode: 'SY3 7AB',
    address: '14 Abbey Foregate, Shrewsbury',
    addrCheckedDaysAgo: 40,
    occasion: { type: 'birthday', daysFromToday: 19, age: 60 },
  },
  {
    id: 'person_dan',
    name: 'Dan Okafor',
    relationship: 'friend',
    postcode: 'M20 2RN',
    address: '8 Burton Road, Manchester',
    addrCheckedDaysAgo: 90,
    occasion: { type: 'birthday', daysFromToday: 9, age: 34 },
  },
  {
    id: 'person_priya',
    name: 'Priya and Tom',
    relationship: 'friends',
    postcode: 'LS6 3BQ',
    address: '21 Cardigan Road, Leeds',
    addrCheckedDaysAgo: 426,
    occasion: { type: 'anniversary', daysFromToday: 24, age: 6 },
  },
  {
    id: 'person_bill',
    name: 'Bill Ellis',
    relationship: 'grandfather',
    postcode: 'B13 8JP',
    address: '3 Wake Green Road, Birmingham',
    addrCheckedDaysAgo: 30,
    occasion: { type: 'birthday', daysFromToday: 3, age: 88 },
  },
  {
    id: 'person_sam',
    name: 'Sam Whitlock',
    relationship: 'colleague',
    postcode: 'EC1R 5EN',
    address: 'Unit 4, Clerkenwell Green, London',
    addrCheckedDaysAgo: 10,
    occasion: { type: 'leaving', daysFromToday: 1, adhoc: true },
  },
  {
    id: 'person_noor',
    name: 'Noor Rahman',
    relationship: 'aunt',
    postcode: 'BD8 7RL',
    address: '55 Oak Lane, Bradford',
    addrCheckedDaysAgo: 60,
    occasion: { type: 'eid', feast: true },
  },
  {
    id: 'person_asha',
    name: 'Asha Patel',
    relationship: 'friend',
    postcode: 'LE4 6AS',
    address: '12 Belgrave Road, Leicester',
    addrCheckedDaysAgo: 60,
    occasion: { type: 'diwali', feast: true },
  },
  {
    id: 'person_peter',
    name: 'Peter Ellis',
    relationship: 'uncle',
    postcode: 'BS7 8QT',
    address: '9 Gloucester Road, Bristol',
    addrCheckedDaysAgo: 200,
    paused: { reason: 'Bereavement', daysAgo: 90 },
    occasion: { type: 'birthday', daysFromToday: 12, age: 71 },
  },
];

export interface SeedOptions {
  reset?: boolean;
  today?: Date;
  log?: (msg: string) => void;
}

/** Idempotent demo seed. With reset, demo data is removed first so every run starts identical. */
export async function seedDemo(prisma: PrismaClient, opts: SeedOptions = {}): Promise<void> {
  const today = startOfDay(opts.today ?? new Date());
  const log = opts.log ?? (() => {});

  if (opts.reset) {
    log('resetting demo data');
    await prisma.decision.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.referral.deleteMany({});
    await prisma.account.deleteMany({
      where: {
        OR: [
          { id: DEMO_ACCOUNT_ID },
          { email: { endsWith: '@referral.dearly.invalid' } },
          { email: { endsWith: '@recipient.dearly.invalid' } },
        ],
      },
    });
    await prisma.organisation.deleteMany({ where: { id: DEMO_ORG_ID } });
    await prisma.setting.deleteMany({});
  }

  for (const p of PRINTERS) {
    await prisma.printer.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        city: p.city,
        sizes: [...p.sizes],
        finishes: [...p.finishes],
        areas: [...p.areas],
        capacity: p.capacity,
        score: p.score,
      },
      create: {
        id: p.id,
        name: p.name,
        city: p.city,
        sizes: [...p.sizes],
        finishes: [...p.finishes],
        areas: [...p.areas],
        capacity: p.capacity,
        score: p.score,
      },
    });
  }

  await prisma.account.upsert({
    where: { id: DEMO_ACCOUNT_ID },
    update: { name: 'Alex' },
    create: { id: DEMO_ACCOUNT_ID, name: 'Alex', email: 'alex@dearly.invalid', isDemo: true },
  });

  for (const p of PEOPLE) {
    const occ = p.occasion;
    const date = occ.daysFromToday != null ? addDays(today, occ.daysFromToday) : null;
    await prisma.person.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        accountId: DEMO_ACCOUNT_ID,
        name: p.name,
        relationship: p.relationship,
        address: p.address,
        postcode: p.postcode,
        addrCheckedAt: addDays(today, -p.addrCheckedDaysAgo),
        pausedReason: p.paused?.reason ?? null,
        pausedAt: p.paused ? addDays(today, -p.paused.daysAgo) : null,
        note: p.note ?? null,
      },
    });
    await prisma.occasion.upsert({
      where: { id: `${p.id}_occ` },
      update: {},
      create: {
        id: `${p.id}_occ`,
        personId: p.id,
        type: occ.type,
        monthDay: date && !occ.adhoc ? monthDayOf(date) : null,
        feastKey: occ.feast ? occ.type : null,
        startYear: date && occ.age != null ? date.getFullYear() - occ.age : null,
        adhocDate: date && occ.adhoc ? isoDate(date) : null,
      },
    });
  }

  // Two past orders. Dan's birthday last year, delivered and rated 5; a thank-you card to Priya
  // and Tom posted two days ago and promised in two days, ready for "Simulate a postal delay".
  const danCard: CardSpec = {
    design: 'balloons',
    size: 'regular',
    finish: 'signature',
    mode: 'advance',
    modeOverridden: false,
    digital: false,
    gift: 'none',
    message:
      'Happy birthday, Dan. Hope the day is full of the people and things you love. Love, Alex',
    font: 'hand',
  };
  const danQuote = quote(danCard);
  const danOccasion = addYears(addDays(today, 9), -1);
  await prisma.order.upsert({
    where: { id: 'ord_seed_dan' },
    update: {},
    create: {
      id: 'ord_seed_dan',
      accountId: DEMO_ACCOUNT_ID,
      personId: 'person_dan',
      recipientName: 'Dan Okafor',
      occasionType: 'birthday',
      occasionDate: danOccasion,
      cardSpec: json(danCard),
      quote: json(danQuote),
      totalPence: danQuote.totalPence,
      mode: 'advance',
      promisedDate: addDays(danOccasion, -2),
      guarantee: true,
      stage: 'delivered',
      stageHistory: json([
        { stage: 'checked', at: addDays(danOccasion, -12).toISOString() },
        { stage: 'routed', at: addDays(danOccasion, -12).toISOString() },
        { stage: 'printed', at: addDays(danOccasion, -11).toISOString() },
        { stage: 'inspected', at: addDays(danOccasion, -11).toISOString() },
        { stage: 'posted', at: addDays(danOccasion, -7).toISOString() },
        { stage: 'delivered', at: addDays(danOccasion, -2).toISOString() },
      ]),
      printerId: 'mcr',
      recipientSlug: SEED_SLUGS.danDelivered,
      createdAt: addDays(danOccasion, -12),
      rating: { create: { stars: 5, comment: 'Lovely card, arrived early.' } },
    },
  });

  const priyaCard: CardSpec = {
    design: 'wreath',
    size: 'regular',
    finish: 'classic',
    mode: 'advance',
    modeOverridden: false,
    digital: false,
    gift: 'none',
    message: 'Thank you both for a lovely weekend. It meant a great deal. Love, Alex',
    font: 'hand',
  };
  const priyaQuote = quote(priyaCard);
  await prisma.order.upsert({
    where: { id: 'ord_seed_priya' },
    update: {},
    create: {
      id: 'ord_seed_priya',
      accountId: DEMO_ACCOUNT_ID,
      personId: 'person_priya',
      recipientName: 'Priya and Tom',
      occasionType: 'thank_you',
      occasionDate: addDays(today, 4),
      cardSpec: json(priyaCard),
      quote: json(priyaQuote),
      totalPence: priyaQuote.totalPence,
      mode: 'advance',
      promisedDate: addDays(today, 2),
      guarantee: true,
      stage: 'posted',
      stageHistory: json([
        { stage: 'checked', at: addDays(today, -3).toISOString() },
        { stage: 'routed', at: addDays(today, -3).toISOString() },
        { stage: 'printed', at: addDays(today, -2).toISOString() },
        { stage: 'inspected', at: addDays(today, -2).toISOString() },
        { stage: 'posted', at: addDays(today, -2).toISOString() },
      ]),
      printerId: 'leeds',
      recipientSlug: SEED_SLUGS.priyaPosted,
      createdAt: addDays(today, -3),
    },
  });

  // Inventory: three received cards and the sent copy of Dan's card.
  const received = [
    {
      id: 'inv_from_margaret',
      fromName: 'Margaret Ellis',
      occasionType: 'birthday',
      design: 'balloons',
      receivedAt: addDays(today, -120),
      message: 'Happy birthday, love. Come for Sunday lunch soon. Mum x',
    },
    {
      id: 'inv_from_bill',
      fromName: 'Bill Ellis',
      occasionType: 'christmas',
      design: 'tree',
      receivedAt: new Date(today.getFullYear() - 1, 11, 25),
      message: 'Merry Christmas, Alex. Grandad.',
    },
    {
      id: 'inv_from_dan',
      fromName: 'Dan Okafor',
      occasionType: 'birthday',
      design: 'balloons',
      receivedAt: addDays(addYears(today, -RULES.inventoryYears), 20),
      message: 'Happy birthday mate. Pint soon? Dan',
    },
  ];
  for (const item of received) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        accountId: DEMO_ACCOUNT_ID,
        direction: 'received',
        fromName: item.fromName,
        toName: 'Alex',
        occasionType: item.occasionType,
        design: item.design,
        message: item.message,
        receivedAt: item.receivedAt,
        keptUntil: addYears(item.receivedAt, RULES.inventoryYears),
      },
    });
  }
  await prisma.inventoryItem.upsert({
    where: { id: 'inv_sent_dan' },
    update: {},
    create: {
      id: 'inv_sent_dan',
      accountId: DEMO_ACCOUNT_ID,
      direction: 'sent',
      fromName: 'Alex',
      toName: 'Dan Okafor',
      occasionType: 'birthday',
      design: 'balloons',
      message: danCard.message,
      receivedAt: addDays(danOccasion, -2),
      keptUntil: addYears(addDays(danOccasion, -2), RULES.inventoryYears),
      cardSpec: json(danCard),
    },
  });

  await prisma.organisation.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: {
      id: DEMO_ORG_ID,
      name: 'Northern Quarter Studio',
      plan: 'payg',
      deliveryOption: 'posted',
      staffText: seedStaffText(today),
    },
  });

  await prisma.partner.upsert({
    where: { id: FLORIST_PARTNER_ID },
    update: {},
    create: {
      id: FLORIST_PARTNER_ID,
      type: 'florist',
      name: 'Bloom and Co',
      city: 'Leicester',
      feePence: 150,
      commissionPct: 7,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'costs' },
    update: {},
    create: { key: 'costs', value: json(DEFAULT_COSTS) },
  });
  await prisma.setting.upsert({
    where: { key: 'forecastCustomers' },
    update: {},
    create: { key: 'forecastCustomers', value: 5000 },
  });

  const decisions = await prisma.decision.count();
  if (decisions === 0) {
    await prisma.decision.createMany({
      data: [
        {
          actor: 'rule',
          job: 'seed',
          summary: 'Demo data seeded: 8 people, 2 orders, 3 received cards, 6 simulated printers',
          at: addDays(today, -3),
        },
        {
          actor: 'rule',
          job: 'route',
          summary: "Routed Dan Okafor's birthday card to Ancoats Digital (Manchester)",
          orderId: 'ord_seed_dan',
          at: addDays(danOccasion, -12),
        },
        {
          actor: 'rule',
          job: 'route',
          summary: "Routed Priya and Tom's thank-you card to Aire Street Press (Leeds)",
          orderId: 'ord_seed_priya',
          at: addDays(today, -3),
        },
        {
          actor: 'person',
          job: 'rating',
          summary: 'Dan Okafor rated the card 5 stars',
          orderId: 'ord_seed_dan',
          at: addDays(danOccasion, -1),
        },
      ],
    });
  }
  log('seed complete');
}
