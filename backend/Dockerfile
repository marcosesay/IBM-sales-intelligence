FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json build.mjs ./
COPY src ./src

RUN pnpm run build

# ---

FROM node:22-alpine AS runtime

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3003

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
