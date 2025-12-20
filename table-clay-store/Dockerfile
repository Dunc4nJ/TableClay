# Table Clay Medusa Backend - Production Dockerfile
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies (without --check-cache to avoid checksum issues)
RUN corepack enable && corepack prepare yarn@3.2.1 --activate
RUN yarn install --immutable

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.medusa ./.medusa
COPY --from=base /app/package.json ./
COPY --from=base /app/medusa-config.ts ./
COPY --from=base /app/src ./src

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

# Start Medusa
CMD ["yarn", "start"]
