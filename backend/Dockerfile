FROM node:22-slim

WORKDIR /app

COPY backend/package*.json ./backend/
COPY backend/gateway/package*.json ./backend/gateway/
COPY backend/services/auth/package*.json ./backend/services/auth/
COPY backend/services/chat/package*.json ./backend/services/chat/
COPY backend/services/agent/package*.json ./backend/services/agent/
COPY backend/services/billing/package*.json ./backend/services/billing/
COPY mcp-server/package*.json ./mcp-server/

RUN npm ci --omit=dev --prefix ./backend \
    && npm ci --omit=dev --prefix ./backend/gateway \
    && npm ci --omit=dev --prefix ./backend/services/auth \
    && npm ci --omit=dev --prefix ./backend/services/chat \
    && npm ci --omit=dev --prefix ./backend/services/agent \
    && npm ci --omit=dev --prefix ./backend/services/billing \
    && npm ci --omit=dev --prefix ./mcp-server

COPY backend/gateway ./backend/gateway
COPY backend/services/auth ./backend/services/auth
COPY backend/services/chat ./backend/services/chat
COPY backend/services/agent ./backend/services/agent
COPY backend/services/billing ./backend/services/billing
COPY backend/shared ./backend/shared
COPY mcp-server/src ./mcp-server/src
COPY backend/start-all.js ./backend/start-all.js

EXPOSE 10000

CMD ["node", "backend/start-all.js"]
