import { PrismaClient } from '@prisma/client';

import { seedDemo } from '../src/server/seed/seedDemo';

const prisma = new PrismaClient();
const reset = process.argv.includes('--reset');

seedDemo(prisma, { reset, log: (m) => console.log(`[seed] ${m}`) })
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
