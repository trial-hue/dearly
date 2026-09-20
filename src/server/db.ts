import { PrismaClient } from '@prisma/client';

import { databaseUrl } from '@/env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** One Prisma client per process. Services are the only callers. */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
