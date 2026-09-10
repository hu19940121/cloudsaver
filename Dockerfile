FROM node:20-alpine AS build

WORKDIR /build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY frontend/ ./frontend/
COPY backend/ ./backend/
RUN pnpm --filter cloud-saver-web build \
    && pnpm --filter cloud-saver-server build

FROM node:20-alpine AS production

RUN apk add --no-cache nginx

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN corepack enable \
    && pnpm install --prod --frozen-lockfile --filter cloud-saver-server \
    && pnpm store prune

COPY --from=build /build/backend/dist ./backend/dist
COPY --from=build /build/backend/.env.example ./.env.example
COPY --from=build /build/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/config /app/data \
    && chmod +x /app/docker-entrypoint.sh

VOLUME ["/app/config", "/app/data"]
EXPOSE 8008

ENTRYPOINT ["/app/docker-entrypoint.sh"]
