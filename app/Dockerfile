# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept VITE_API_URL as build argument (Railway passes env vars as build args)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - simple static server
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

# serve.json prevents caching of index.html so browsers always get the latest JS/CSS hashes
RUN echo '{"headers":[{"source":"index.html","headers":[{"key":"Cache-Control","value":"no-cache, no-store, must-revalidate"},{"key":"Pragma","value":"no-cache"},{"key":"Expires","value":"0"}]},{"source":"assets/**","headers":[{"key":"Cache-Control","value":"public, max-age=31536000, immutable"}]}]}' > dist/serve.json

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "serve dist -s -l $PORT"]
