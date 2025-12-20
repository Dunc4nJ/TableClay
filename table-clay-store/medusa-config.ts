import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  // Stripe payment provider will be added once API keys are configured
  // modules: [
  //   {
  //     resolve: "@medusajs/medusa/payment-stripe",
  //     options: {
  //       apiKey: process.env.STRIPE_API_KEY,
  //     },
  //   },
  // ],
})
