# Table Clay Medusa Backend - Production Dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files and patches
COPY package.json yarn.lock .yarnrc.yml ./
COPY patches/ ./patches/

# Install dependencies (postinstall runs patch-package)
# Use Yarn classic to match the v1 lockfile format in this app.
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
# Note: Not using --immutable to allow patch-package to modify node_modules
RUN yarn install

# Explicitly run patch-package to ensure patches are applied
RUN npx patch-package

# Copy source code and config
COPY . .

# Run unit tests before build (fails build if tests fail)
RUN yarn test:unit --passWithNoTests

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
