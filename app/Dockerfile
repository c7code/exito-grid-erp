# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

ARG CACHEBUST=1
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

ENV PORT=3000
EXPOSE 3000

# -s = SPA mode (rewrite 404s to index.html, assets servidos normalmente)
CMD ["sh", "-c", "serve dist -s -l $PORT"]


