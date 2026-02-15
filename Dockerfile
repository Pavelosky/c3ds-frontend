# Multi-stage build for optimized image size
# Stage 1: Builder - Build React app with Vite
FROM node:20-alpine as builder

WORKDIR /app

# Install pnpm package manager
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build production bundle
# Vite will use environment variables prefixed with VITE_
RUN pnpm build

# Stage 2: Production - Nginx to serve static files
FROM nginx:alpine

# Install gettext for envsubst (environment variable substitution)
RUN apk add --no-cache gettext

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80 (Railway will use its own PORT)
EXPOSE 80

# Use startup script to substitute environment variables
CMD ["/docker-entrypoint.sh"]
