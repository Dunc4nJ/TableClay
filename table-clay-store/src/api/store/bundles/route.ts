import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import { BUNDLE_MODULE } from "../../../modules/bundle"
import type BundleModuleService from "../../../modules/bundle/service"

/**
 * GET /store/bundles
 * List bundles for a product (used by BundleSelector component)
 * Query params: product_id (required)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { product_id } = req.query

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: "product_id query parameter is required",
      })
    }

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)
    const productService: IProductModuleService =
      req.scope.resolve(Modules.PRODUCT)

    // Get active bundles for this product
    const bundles = await bundleService.listBundlesByProduct(
      product_id as string
    )

    // Enrich bundles with pricing and variant details
    const enrichedBundles = await Promise.all(
      bundles.map(async (bundle) => {
        // Get bundle items
        const items = await bundleService.getItemsForBundle(bundle.id)

        // Fetch variant details for each item
        let componentTotalCents = 0
        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            try {
              // Get variant with product info
              const variants = await productService.listProductVariants(
                { id: item.variant_id },
                {
                  relations: ["product"],
                  select: [
                    "id",
                    "title",
                    "sku",
                    "product.id",
                    "product.title",
                    "product.thumbnail",
                  ],
                }
              )
              const variant = variants[0]

              // Get variant price for component total calculation
              // Note: For percentage pricing, we need to calculate from component prices
              // For now, we'll skip price fetching here as it requires pricing context

              return {
                id: item.id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                sort_order: item.sort_order,
                variant: variant
                  ? {
                      id: variant.id,
                      title: variant.title,
                      sku: variant.sku,
                      product: variant.product
                        ? {
                            id: variant.product.id,
                            title: variant.product.title,
                            thumbnail: variant.product.thumbnail,
                          }
                        : null,
                    }
                  : null,
              }
            } catch (err) {
              console.warn(
                `Could not fetch variant ${item.variant_id}:`,
                err instanceof Error ? err.message : err
              )
              return {
                id: item.id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                sort_order: item.sort_order,
                variant: null,
              }
            }
          })
        )

        // Calculate pricing
        const pricing = bundleService.calculateBundlePricing(
          bundle,
          componentTotalCents > 0 ? componentTotalCents : undefined
        )

        // Get badge display text
        const badgeText = bundleService.getBadgeDisplayText(bundle.badge)

        return {
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          pricing_type: bundle.pricing_type,
          original_price: pricing.original_price,
          sale_price: pricing.sale_price,
          savings: pricing.savings,
          savings_percent: pricing.savings_percent,
          badge: bundle.badge,
          badge_text: badgeText,
          sort_order: bundle.sort_order,
          items: enrichedItems,
        }
      })
    )

    return res.json({
      success: true,
      bundles: enrichedBundles,
    })
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch bundles",
    })
  }
}
