import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      // Main upload endpoint for product images
      // Increased from 25MB to 100MB to support high-resolution product photography
      matcher: "/admin/uploads",
      bodyParser: {
        sizeLimit: "100mb"
      }
    },
    {
      // Catch sub-routes like /admin/uploads/:id
      matcher: "/admin/uploads/*",
      bodyParser: {
        sizeLimit: "100mb"
      }
    },
  ],
})
