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

# Replace main nginx config with one that uses /tmp for all writable paths
COPY nginx-main.conf /etc/nginx/nginx.conf

RUN mkdir -p \
    /tmp/nginx-client-body \
    /tmp/nginx-proxy \
    /tmp/nginx-fastcgi \
    /tmp/nginx-uwsgi \
    /tmp/nginx-scgi && \
    chown -R nginx:nginx \
        /var/log/nginx \
        /etc/nginx/conf.d \
        /usr/share/nginx/html \
        /tmp/nginx-client-body \
        /tmp/nginx-proxy \
        /tmp/nginx-fastcgi \
        /tmp/nginx-uwsgi \
        /tmp/nginx-scgi

COPY --from=builder /app/dist/public /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/nginx.conf.template

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nginx

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
