import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const MAIN_CATEGORY_HANDLES = new Set(["mugs", "vases", "bowls"])
const ODDS_ENDS_CATEGORY_HANDLE = "odd-and-ends"
const PAGE_SIZE = 100

export default async function backfillOddsEndsCategory({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT)

  const [oddsEndsCategory] = await productModuleService.listProductCategories(
    { handle: ODDS_ENDS_CATEGORY_HANDLE },
    { select: ["id", "handle"] }
  )

  if (!oddsEndsCategory) {
    console.error("[Backfill] Odds & Ends category not found.")
    return
  }

  let skip = 0
  let processed = 0
  let updated = 0

  while (true) {
    const products = await productModuleService.listProducts(
      {},
      {
        relations: ["categories"],
        take: PAGE_SIZE,
        skip,
      }
    )

    if (!products.length) {
      break
    }

    for (const product of products) {
      const categories = product.categories || []
      const categoryHandles = categories.map((category) => category.handle)
      const categoryIds = categories.map((category) => category.id)

      const hasMainCategory = categoryHandles.some((handle) =>
        MAIN_CATEGORY_HANDLES.has(handle)
      )
      const hasOddsEnds = categoryHandles.includes(ODDS_ENDS_CATEGORY_HANDLE)

      if (!hasMainCategory && !hasOddsEnds) {
        const nextCategoryIds = Array.from(
          new Set([...categoryIds, oddsEndsCategory.id])
        )

        await productModuleService.updateProducts(product.id, {
          category_ids: nextCategoryIds,
        })
        updated += 1
        continue
      }

      if (hasMainCategory && hasOddsEnds) {
        const oddsEndsCategoryId = categories.find(
          (category) => category.handle === ODDS_ENDS_CATEGORY_HANDLE
        )?.id

        if (!oddsEndsCategoryId) {
          continue
        }

        await productModuleService.updateProducts(product.id, {
          category_ids: categoryIds.filter((id) => id !== oddsEndsCategoryId),
        })
        updated += 1
      }
    }

    processed += products.length
    skip += products.length
  }

  console.log(
    `[Backfill] Processed ${processed} products. Updated ${updated} products.`
  )
}
