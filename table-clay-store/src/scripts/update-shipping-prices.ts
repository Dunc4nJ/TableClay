import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { updateShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Migration script to update shipping option prices.
 *
 * Run with: npx medusa exec ./src/scripts/update-shipping-prices.ts
 *
 * This script updates:
 * - "Standard Shipping": $8 -> $5 (800 -> 500 cents)
 * - "Standard Shipping + Premium Protection": $12 -> $8 (1200 -> 800 cents)
 */
export default async function updateShippingPrices({ container }: ExecArgs) {
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  console.log("Fetching shipping options...")

  // Get all shipping options
  const shippingOptions = await fulfillmentService.listShippingOptions({})

  console.log(`Found ${shippingOptions.length} shipping options:`)
  shippingOptions.forEach((opt) => {
    console.log(`  - ID: ${opt.id}, Name: "${opt.name}"`)
  })

  const updates: Array<{
    id: string
    prices: Array<{ currency_code: string; amount: number }>
  }> = []

  // Match shipping options to updates
  for (const option of shippingOptions) {
    const optionNameLower = option.name.toLowerCase()

    // Check for "Standard Shipping + Premium Protection" first (more specific match)
    // This includes both "standard" and "premium" in the name
    if (optionNameLower.includes("premium protection")) {
      console.log(
        `\nMatched "${option.name}" -> Standard + Premium Protection ($8.00)`
      )
      updates.push({
        id: option.id,
        prices: [{ currency_code: "usd", amount: 800 }],
      })
    }
    // Check for plain "Standard Shipping" (not including premium protection)
    else if (
      optionNameLower.includes("standard") &&
      !optionNameLower.includes("premium")
    ) {
      console.log(`\nMatched "${option.name}" -> Standard Shipping ($5.00)`)
      updates.push({
        id: option.id,
        prices: [{ currency_code: "usd", amount: 500 }],
      })
    } else {
      console.log(`\nSkipping "${option.name}" - no matching rule`)
    }
  }

  if (updates.length === 0) {
    console.log("\nNo shipping options matched. No updates made.")
    return
  }

  console.log(`\nApplying ${updates.length} price update(s)...`)

  try {
    await updateShippingOptionsWorkflow(container).run({
      input: updates,
    })

    console.log("\n✅ Shipping prices updated successfully!")
    console.log("\nNew prices:")
    updates.forEach((update) => {
      const option = shippingOptions.find((o) => o.id === update.id)
      console.log(
        `  - "${option?.name}": $${(update.prices[0].amount / 100).toFixed(2)}`
      )
    })
  } catch (error) {
    console.error("\n❌ Failed to update shipping prices:", error)
    throw error
  }
}
