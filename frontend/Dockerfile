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

# Allow nginx to run as non-root (required by IBM Code Engine)
RUN sed -i 's|user  nginx;||g' /etc/nginx/nginx.conf && \
    sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    chmod -R 755 /var/cache/nginx /var/log/nginx

COPY --from=builder /app/dist/public /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint substitutes BACKEND_URL env var into nginx config at runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nginx

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
