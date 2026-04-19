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

# Production stage - nginx for reliable static file serving
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing
RUN echo 'server { \
    listen 3000; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Serve static assets with correct MIME types and caching \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
        try_files $uri =404; \
    } \
    \
    # SPA fallback - only for non-file routes \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

ENV PORT=3000
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
