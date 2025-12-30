# Table Clay Medusa Backend - Production Dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files and patches
COPY package.json yarn.lock .yarnrc.yml ./
COPY patches/ ./patches/

# Install dependencies (postinstall runs patch-package)
RUN corepack enable && corepack prepare yarn@3.2.1 --activate
RUN yarn install --immutable

# Copy source code and config
COPY . .

# Build the application
RUN yarn build

# Copy admin build to expected location
RUN mkdir -p ./public && cp -r ./.medusa/server/public/admin ./public/admin

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

# Run migrations then start server
CMD ["sh", "-c", "yarn medusa db:migrate && yarn medusa start"]
