# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage — nginx para SPA (com try_files correto)
FROM nginx:alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia config com try_files para React Router
COPY nginx.conf /etc/nginx/templates/app.conf.template

# Copia build do React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

# nginx:alpine com template auto-substitui ${PORT} via envsubst
ENV PORT=3000
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/app.conf.template > /etc/nginx/conf.d/app.conf && nginx -g 'daemon off;'"]
