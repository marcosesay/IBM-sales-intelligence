FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY tsconfig.json build.mjs ./
COPY src ./src

RUN npm run build

# ---

FROM node:22-alpine AS runtime

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 8080

USER node

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
