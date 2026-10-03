# ==========================================
# Multi-stage Dockerfile for PRIME OS
# ==========================================

# Stage 1: Build the React + Tailwind Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root package.json & server code
COPY package*.json ./
COPY server/ ./server/

# Copy compiled frontend from Stage 1 into client/dist
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/gateway.js"]
