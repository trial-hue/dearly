import type { Prisma } from '@prisma/client';

/** Prisma JSON columns take InputJsonValue; this strips Dates and undefined the same way JSON does. */
export function json<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
