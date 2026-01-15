import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Product Collection Auto-Assign Subscriber
 *
 * Automatically assigns products to the "Odds & Ends" collection if they don't
 * have a main category (mugs, vases, or bowls).
 *
 * Logic:
 * - If product has NO main category → add to "no-line" collection
 * - If product HAS main category AND is in "no-line" → remove from it
 */

// Category handles that indicate a product is properly categorized
const MAIN_CATEGORY_HANDLES = ["mugs", "vases", "bowls"]

// The "Odds & Ends" collection handle
const ODDS_ENDS_COLLECTION_HANDLE = "no-line"

type Category = { handle: string }
type Collection = { id: string; handle: string }

export default async function productCollectionAutoAssign({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const query = container.resolve("query")

  try {
    // Fetch product with categories and collections
    const { data: [product] } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "categories.handle",
        "collections.id",
        "collections.handle",
      ],
      filters: { id: data.id },
    })

    if (!product) {
      console.log(`[AutoAssign] Product not found: ${data.id}`)
      return
    }

    const categoryHandles = ((product.categories || []) as Category[]).map((c) => c.handle)
    const collections = (product.collections || []) as Collection[]
    const collectionHandles = collections.map((c) => c.handle)

    // Check if product has any main category
    const hasMainCategory = categoryHandles.some((h) =>
      MAIN_CATEGORY_HANDLES.includes(h)
    )

    // Check if already in Odds & Ends collection
    const isInOddsEnds = collectionHandles.includes(ODDS_ENDS_COLLECTION_HANDLE)

    if (!hasMainCategory && !isInOddsEnds) {
      // Product is uncategorized and NOT in Odds & Ends - add it

      // Find the Odds & Ends collection ID
      const { data: collectionsData } = await query.graph({
        entity: "product_collection",
        fields: ["id", "handle"],
        filters: { handle: ODDS_ENDS_COLLECTION_HANDLE },
      })

      const oddsEndsCollection = collectionsData?.[0]

      if (!oddsEndsCollection) {
        console.error("[AutoAssign] Odds & Ends collection not found!")
        return
      }

      // Add product to collection
      await productModuleService.updateProducts(data.id, {
        collection_id: oddsEndsCollection.id,
      })

      console.log(`[AutoAssign] Added "${product.title}" to Odds & Ends collection`)
    } else if (hasMainCategory && isInOddsEnds) {
      // Product now has a main category but is still in Odds & Ends - remove it
      await productModuleService.updateProducts(data.id, {
        collection_id: null,
      })

      console.log(`[AutoAssign] Removed "${product.title}" from Odds & Ends (now categorized as ${categoryHandles.join(", ")})`)
    }
  } catch (error) {
    console.error("[AutoAssign] Error processing product:", error)
    // Don't throw - auto-assignment failure shouldn't block product operations
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
