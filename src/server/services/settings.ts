import { DEFAULT_COSTS, type Costs } from '@/domain';
import { prisma } from '@/server/db';
import { json } from '@/server/json';

export interface Settings {
  costs: Costs;
  forecastCustomers: number;
}

function asCosts(value: unknown): Costs {
  const v = (value ?? {}) as Partial<Record<keyof Costs, unknown>>;
  const num = (k: keyof Costs) =>
    typeof v[k] === 'number' && Number.isFinite(v[k]) ? (v[k] as number) : DEFAULT_COSTS[k];
  return {
    payPct: num('payPct'),
    payFixed: num('payFixed'),
    ai: num('ai'),
    service: num('service'),
    guarantee: num('guarantee'),
    teamPerYear: num('teamPerYear'),
  };
}

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['costs', 'forecastCustomers'] } },
  });
  const costs = asCosts(rows.find((r) => r.key === 'costs')?.value);
  const customersRaw = rows.find((r) => r.key === 'forecastCustomers')?.value;
  const forecastCustomers = typeof customersRaw === 'number' ? customersRaw : 5000;
  return { costs, forecastCustomers };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  if (patch.costs) {
    const costs = asCosts({ ...(await getSettings()).costs, ...patch.costs });
    await prisma.setting.upsert({
      where: { key: 'costs' },
      update: { value: json(costs) },
      create: { key: 'costs', value: json(costs) },
    });
  }
  if (patch.forecastCustomers != null) {
    const n = Math.min(100_000, Math.max(500, Math.round(patch.forecastCustomers)));
    await prisma.setting.upsert({
      where: { key: 'forecastCustomers' },
      update: { value: n },
      create: { key: 'forecastCustomers', value: n },
    });
  }
  return getSettings();
}
