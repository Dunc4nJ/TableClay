import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      // Main upload endpoint for product images
      matcher: "/admin/uploads",
      bodyParser: {
        sizeLimit: "25mb"
      }
    },
    {
      // Catch sub-routes like /admin/uploads/:id
      matcher: "/admin/uploads/*",
      bodyParser: {
        sizeLimit: "25mb"
      }
    },
  ],
})
