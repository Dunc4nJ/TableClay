import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  batchLinkProductsToCategoryWorkflow,
  createProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function createPotteryWheelCategory({
  container,
}: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)

  const existingCategories = await productService.listProductCategories({
    handle: "pottery-wheel",
  })

  if (existingCategories.length > 0) {
    console.log("Pottery Wheel category already exists")
    return
  }

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Pottery Wheel",
          handle: "pottery-wheel",
          description: "Everything you need to start your pottery journey",
          is_active: true,
        },
      ],
    },
  })

  const categoryId = categoryResult[0]?.id

  if (!categoryId) {
    console.error("Failed to create Pottery Wheel category")
    return
  }

  console.log(`Created Pottery Wheel category with ID: ${categoryId}`)

  const products = await productService.listProducts({
    handle: ["mini-wheel", "air-dry-clay"],
  })

  if (!products.length) {
    console.warn("Warning: Could not find products to assign to category")
    return
  }

  const productIds = products.map((product) => product.id)

  await batchLinkProductsToCategoryWorkflow(container).run({
    input: {
      id: categoryId,
      add: productIds,
    },
  })

  console.log(
    `Assigned ${productIds.length} products to Pottery Wheel category`
  )
}
