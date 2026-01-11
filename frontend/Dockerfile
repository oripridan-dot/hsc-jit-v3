# Dockerfile for HSC-JIT Frontend
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# ============ Production Stage ============
FROM node:18-alpine

WORKDIR /app

# Install serve to run production build
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

# Start server
CMD ["serve", "-s", "dist", "-l", "5173"]
