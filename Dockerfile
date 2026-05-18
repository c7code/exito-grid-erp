# ═══════════════════════════════════════════════════════════════════
# STAGE 1: Build do Frontend React (Vite)
# ═══════════════════════════════════════════════════════════════════
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# VITE_API_URL: Railway injeta via ARG/ENV no servico
# Fallback: /api (relativo, para servico unificado)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY app/package.json app/package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY app/ ./
RUN npm run build

# ═══════════════════════════════════════════════════════════════════
# STAGE 2: Build da API NestJS
# ═══════════════════════════════════════════════════════════════════
FROM node:18-alpine AS api-builder

WORKDIR /app

COPY electraflow-api/package*.json ./
RUN npm ci

COPY electraflow-api/ ./
RUN npm run build

# ═══════════════════════════════════════════════════════════════════
# STAGE 3: Runtime — API + Frontend juntos
# ═══════════════════════════════════════════════════════════════════
FROM node:18-alpine

WORKDIR /app

COPY electraflow-api/package*.json ./
RUN npm ci --only=production

# API compilada
COPY --from=api-builder /app/dist ./dist

# Frontend buildado -> servido pela API como arquivos estaticos
COPY --from=frontend-builder /frontend/dist ./public/frontend

EXPOSE 3000

CMD ["node", "dist/main"]
