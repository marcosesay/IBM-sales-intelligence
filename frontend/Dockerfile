FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY index.html tsconfig.json vite.config.ts components.json ./
COPY public ./public
COPY src ./src

RUN npm run build

# ---

FROM nginx:alpine AS runtime

# Make nginx work as non-root (for IBM Code Engine)
RUN sed -i 's|user  nginx;||g' /etc/nginx/nginx.conf && \
    sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf && \
    sed -i 's|/var/cache/nginx|/tmp/nginx-cache|g' /etc/nginx/nginx.conf && \
    mkdir -p /tmp/nginx-cache /tmp/nginx.pid && \
    chown -R nginx:nginx \
        /var/cache/nginx \
        /var/log/nginx \
        /etc/nginx/conf.d \
        /usr/share/nginx/html \
        /tmp/nginx-cache

COPY --from=builder /app/dist/public /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/nginx.conf.template

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nginx

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
