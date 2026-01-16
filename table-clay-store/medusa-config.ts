import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { NodeHttpHandler } from '@smithy/node-http-handler'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    // Redis Event Bus for production (replaces in-memory)
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    // Stripe Payment Provider
    // NOTE: Do NOT add 'id' field - it creates pp_stripe_<id> instead of pp_stripe
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              // Ensure PaymentIntents are captured automatically on successful confirmation.
              capture: true,
            },
          },
        ],
      },
    },
    // S3 File Storage for product images (only loaded if credentials are present)
    ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? [{
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              // Extended timeout for large product image uploads (5 minutes)
              // AWS SDK v3 requires requestHandler for timeout config
              additional_client_config: {
                maxAttempts: 3,
                requestHandler: new NodeHttpHandler({
                  requestTimeout: 300000, // 5 minutes in ms
                  connectionTimeout: 10000, // 10 seconds to establish connection
                }),
              },
            },
          },
        ],
      },
    }] : []),
    // SendGrid Email Notifications
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-sendgrid",
            id: "sendgrid",
            options: {
              channels: ["email"],
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM || "orders@tableclay.com",
            },
          },
        ],
      },
    },
    // Custom Newsletter Module for subscriber management
    {
      resolve: "./src/modules/newsletter",
    },
    // Custom Bundle Module for product bundling
    {
      resolve: "./src/modules/bundle",
    },
    // Custom Content Module for reviews and FAQs
    {
      resolve: "./src/modules/content",
    },
    // Custom Store Settings Module for global configuration
    {
      resolve: "./src/modules/store-settings",
    },
    // Custom Sales Tracking Module for bestseller functionality
    {
      resolve: "./src/modules/sales-tracking",
    },
  ],
})
