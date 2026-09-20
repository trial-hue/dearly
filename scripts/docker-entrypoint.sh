#!/bin/sh
# Runs migrations, then starts the web server or the worker.
set -e
sh scripts/wait-for-db.sh
prisma migrate deploy --schema prisma/schema.prisma
case "${1:-web}" in
  web) exec node server.js ;;
  worker) exec node dist/worker.mjs ;;
  seed) exec node dist/seed.mjs ;;
  *) exec "$@" ;;
esac
