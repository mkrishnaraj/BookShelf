FROM node:20-alpine AS builder

RUN npm install -g pnpm@9 && \
    apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai/package.json ./packages/ai/

RUN pnpm install --no-frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages
COPY tsconfig.base.json ./

RUN pnpm --filter db generate

RUN pnpm --filter shared build
RUN pnpm --filter db build
RUN pnpm --filter ai build
RUN pnpm --filter api build

FROM node:20-alpine AS runtime

RUN npm install -g pnpm@9
RUN apk add --no-cache dumb-init openssl libc6-compat

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai/package.json ./packages/ai/

RUN pnpm install --no-frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/ai/dist ./packages/ai/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]
