# Coperniq MCP Server - RunPod Serverless Deployment
# NO OpenAI - Uses Claude via Anthropic
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port for RunPod
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start HTTP server (for RunPod)
CMD ["node", "dist/server.js"]
