# =============================================================================
# Stage 1: Build the Vite/React frontend
# =============================================================================
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy root package files (frontend)
COPY package.json package-lock.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source files
COPY index.html index.jsx ./
COPY src/ ./src/
COPY vite.config.js ./

# Build frontend - outputs to dist/
RUN npm run build

# =============================================================================
# Stage 2: Production server
# =============================================================================
FROM node:20-alpine

WORKDIR /app

# Copy service package files
COPY service/package.json service/package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy service source code
COPY service/index.js service/database.js service/cleanup.js ./

# Copy built frontend into the public/ directory the server expects
COPY --from=frontend-build /app/dist ./public/

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "index.js"]
