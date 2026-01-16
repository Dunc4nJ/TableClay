import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Product Collection Auto-Assign Subscriber
 *
 * Automatically assigns products to the "Odds & Ends" category if they don't
 * have a main category (mugs, vases, or bowls).
 *
 * Logic:
 * - If product has NO main category → add to "odd-and-ends" category
 * - If product HAS main category AND is in "odd-and-ends" → remove it
 */

// Category handles that indicate a product is properly categorized
const MAIN_CATEGORY_HANDLES = ["mugs", "vases", "bowls"]

// The "Odds & Ends" category handle
const ODDS_ENDS_CATEGORY_HANDLE = "odd-and-ends"

export default async function productCollectionAutoAssign({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve(Modules.PRODUCT)

  try {
    const product = await productModuleService.retrieveProduct(data.id, {
      relations: ["categories"],
    })

    if (!product) {
      console.log(`[AutoAssign] Product not found: ${data.id}`)
      return
    }

    const categories = product.categories || []
    const categoryHandles = categories.map((category) => category.handle)
    const categoryIds = categories.map((category) => category.id)

    // Check if product has any main category
    const hasMainCategory = categoryHandles.some((h) =>
      MAIN_CATEGORY_HANDLES.includes(h)
    )

    // Check if already in Odds & Ends category
    const isInOddsEnds = categoryHandles.includes(ODDS_ENDS_CATEGORY_HANDLE)

    if (!hasMainCategory && !isInOddsEnds) {
      // Product is uncategorized and NOT in Odds & Ends - add it
      const [oddsEndsCategory] =
        await productModuleService.listProductCategories(
          { handle: ODDS_ENDS_CATEGORY_HANDLE },
          { select: ["id", "handle"] }
        )

      if (!oddsEndsCategory) {
        console.error("[AutoAssign] Odds & Ends category not found!")
        return
      }

      const nextCategoryIds = Array.from(
        new Set([...categoryIds, oddsEndsCategory.id])
      )

      await productModuleService.updateProducts(data.id, {
        category_ids: nextCategoryIds,
      })

      console.log(`[AutoAssign] Added "${product.title}" to Odds & Ends category`)
    } else if (hasMainCategory && isInOddsEnds) {
      // Product now has a main category but is still in Odds & Ends - remove it
      const oddsEndsCategoryId = categories.find(
        (category) => category.handle === ODDS_ENDS_CATEGORY_HANDLE
      )?.id

      if (!oddsEndsCategoryId) {
        return
      }

      await productModuleService.updateProducts(data.id, {
        category_ids: categoryIds.filter((id) => id !== oddsEndsCategoryId),
      })

      console.log(
        `[AutoAssign] Removed "${product.title}" from Odds & Ends (now categorized as ${categoryHandles.join(", ")})`
      )
    }
  } catch (error) {
    console.error("[AutoAssign] Error processing product:", error)
    // Don't throw - auto-assignment failure shouldn't block product operations
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
