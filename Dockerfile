FROM node:20-alpine AS base
RUN corepack enable

WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/core/abi.ts ./src/core/
COPY --from=builder /src/core/*.ts ./src/core/ 2>/dev/null || true

EXPOSE 3000
CMD ["node", "dist/cli/index.js"]
