FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .
RUN pnpm run build

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
