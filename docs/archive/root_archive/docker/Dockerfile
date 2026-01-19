# Dockerfile for HSC-JIT Frontend
FROM node:18-alpine as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files for better caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build with production optimizations
RUN pnpm build

# ============ Production Stage ============
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built app from builder
COPY --from=builder /app/dist .

# Copy nginx config for SPA routing
RUN echo 'server { \
  listen 5173; \
  location / { \
    root /usr/share/nginx/html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
