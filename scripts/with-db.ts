/**
 * Runs a command with a database available.
 *
 *   tsx scripts/with-db.ts [--migrate] [--seed] [--reset] -- <command...>
 *
 * When DATABASE_URL is unset or "embedded", an embedded PostgreSQL cluster is started under
 * .data/pg (created on first use, no install needed) and DATABASE_URL is set for the child.
 * With a real DATABASE_URL the command runs against that database. --migrate runs
 * `prisma migrate deploy`; --seed runs the seed; --reset seeds from scratch.
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
const flags = new Set(sep === -1 ? argv : argv.slice(0, sep));
const command = sep === -1 ? [] : argv.slice(sep + 1);

const EMBEDDED_PORT = Number(process.env.PGPORT ?? 54329);
const EMBEDDED_DIR = path.resolve('.data/pg');
const DB_NAME = process.env.PGDATABASE ?? 'dearly';

type Stoppable = { stop(): Promise<void> };
let embedded: Stoppable | null = null;

function run(cmd: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: process.env });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(`[with-db] failed to start ${cmd}: ${err.message}`);
      resolve(1);
    });
  });
}

async function startEmbedded(): Promise<void> {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const pg = new EmbeddedPostgres({
    databaseDir: EMBEDDED_DIR,
    user: 'postgres',
    password: 'postgres',
    port: EMBEDDED_PORT,
    persistent: true,
    onLog: () => {},
    onError: (msg: unknown) => {
      const text = String(msg).trim();
      if (/terminating connection|Connection terminated/i.test(text)) return; // normal at shutdown
      console.error(`[postgres] ${text}`);
    },
  });
  if (!fs.existsSync(path.join(EMBEDDED_DIR, 'PG_VERSION'))) {
    console.log(`[with-db] creating an embedded PostgreSQL cluster under ${EMBEDDED_DIR}`);
    await pg.initialise();
  }
  const pid = path.join(EMBEDDED_DIR, 'postmaster.pid');
  if (fs.existsSync(pid)) fs.rmSync(pid, { force: true }); // left behind by an unclean exit
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
  } catch {
    // already exists
  }
  process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${EMBEDDED_PORT}/${DB_NAME}`;
  embedded = pg;
  console.log(`[with-db] embedded PostgreSQL ready on port ${EMBEDDED_PORT}`);
}

async function shutdown(code: number): Promise<never> {
  if (embedded) {
    try {
      await embedded.stop();
    } catch {
      // nothing more to do
    }
  }
  process.exit(code);
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url || url === 'embedded') await startEmbedded();

  if (flags.has('--migrate')) {
    const code = await run('prisma', ['migrate', 'deploy']);
    if (code !== 0) await shutdown(code);
  }
  if (flags.has('--seed') || flags.has('--reset')) {
    const code = await run('tsx', ['prisma/seed.ts', ...(flags.has('--reset') ? ['--reset'] : [])]);
    if (code !== 0) await shutdown(code);
  }
  if (command.length === 0) return shutdown(0);

  const child = spawn(command[0] as string, command.slice(1), {
    stdio: 'inherit',
    env: process.env,
  });
  const forward = (signal: NodeJS.Signals) => () => child.kill(signal);
  process.on('SIGINT', forward('SIGINT'));
  process.on('SIGTERM', forward('SIGTERM'));
  child.on('exit', (code) => void shutdown(code ?? 0));
  child.on('error', (err) => {
    console.error(`[with-db] ${err.message}`);
    void shutdown(1);
  });
}

main().catch((err) => {
  console.error(err);
  void shutdown(1);
});
