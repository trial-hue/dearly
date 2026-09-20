# syntax=docker/dockerfile:1
# Multi-stage build: deps -> build -> run. The run image is Next.js standalone output plus the
# Prisma CLI for migrations, running as a non-root user with a health check.

FROM node:24-alpine AS base
RUN apk add --no-cache openssl libc6-compat && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time placeholders only; real values arrive through the environment at run time.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV SESSION_SECRET=build-time-placeholder-secret-not-used-at-runtime
RUN pnpm prisma generate && pnpm build && pnpm build:worker

FROM node:24-alpine AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN apk add --no-cache openssl libc6-compat \
  && addgroup -S dearly && adduser -S dearly -G dearly \
  && npm install -g prisma@6.19.3 \
  && npm cache clean --force
WORKDIR /app
COPY --from=build --chown=dearly:dearly /app/.next/standalone ./
COPY --from=build --chown=dearly:dearly /app/.next/static ./.next/static
COPY --from=build --chown=dearly:dearly /app/public ./public
COPY --from=build --chown=dearly:dearly /app/prisma ./prisma
COPY --from=build --chown=dearly:dearly /app/dist ./dist
COPY --from=build --chown=dearly:dearly /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN mkdir -p /app/.data/uploads && chown -R dearly:dearly /app/.data
USER dearly
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
CMD ["web"]
