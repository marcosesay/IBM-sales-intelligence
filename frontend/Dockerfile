FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --frozen-lockfile

COPY index.html tsconfig.json vite.config.ts components.json ./
COPY public ./public
COPY src ./src

RUN pnpm run build

# ---

FROM nginx:alpine AS runtime

COPY --from=builder /app/dist/public /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
