FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps
COPY frontend ./
RUN npm run build

FROM node:22-alpine AS builder
WORKDIR /app
COPY backend/package.json ./
RUN node -e "const p=require('./package.json'); delete p.devDependencies['@esbuild/darwin-arm64']; require('fs').writeFileSync('./package.json',JSON.stringify(p,null,2))" && \
    npm install --legacy-peer-deps
COPY backend/tsconfig.json backend/build.mjs ./
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=frontend-builder /frontend/dist ./frontend/dist
COPY backend/package.json ./
ENV NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
