# Table Clay Medusa Backend - Production Dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN corepack enable && corepack prepare yarn@3.2.1 --activate
RUN yarn install --immutable

# Copy source code and config
COPY . .

# Build the application
RUN yarn build

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

# Start Medusa
CMD ["yarn", "start"]
