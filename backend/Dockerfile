FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN echo 'approve-builds[]=esbuild' > .npmrc && \
    pnpm install --no-frozen-lockfile

COPY tsconfig.json build.mjs ./
COPY src ./src

RUN pnpm run build

# ---

FROM node:22-alpine AS runtime

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN echo 'approve-builds[]=esbuild' > .npmrc && \
    pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
# PORT must be provided at runtime (IBM Code Engine sets this to 8080 by default)
# All other secrets (WatsonX keys, etc.) must be set as Code Engine environment variables

EXPOSE 8080

USER node

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
