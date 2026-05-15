# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept VITE_API_URL as build argument (Railway passes env vars as build args)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

# Force Docker cache invalidation on every deploy
ARG CACHEBUST=1
COPY . .
RUN npm run build

# Production stage - simple static server
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

# serve.json na raiz /app (nao dentro de dist) para configurar headers + SPA rewrites
RUN echo '{"rewrites":[{"source":"/**","destination":"/index.html"}],"headers":[{"source":"index.html","headers":[{"key":"Cache-Control","value":"no-cache, no-store, must-revalidate"}]},{"source":"assets/**","headers":[{"key":"Cache-Control","value":"public, max-age=31536000, immutable"}]}]}' > serve.json

ENV PORT=3000
EXPOSE 3000

# Serve aponta para dist/ usando serve.json da pasta atual (/app)
CMD ["sh", "-c", "serve dist -l $PORT --config serve.json"]

