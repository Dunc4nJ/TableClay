import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { BUNDLE_MODULE } from "../../../../modules/bundle"
import type BundleModuleService from "../../../../modules/bundle/service"

type AddBundleRequestBody = {
  cart_id: string
  bundle_id: string
}

type RemoveBundleRequestBody = {
  cart_id: string
  bundle_instance_id: string
}

const allocateBundleDiscount = (lineTotals: number[], savings: number) => {
  const total = lineTotals.reduce((sum, value) => sum + value, 0)
  if (!total || savings <= 0 || lineTotals.length === 0) {
    return lineTotals.map(() => 0)
  }

  const normalizedSavings = Math.min(savings, total)
  let allocated = 0

  return lineTotals.map((lineTotal, index) => {
    if (index === lineTotals.length - 1) {
      return normalizedSavings - allocated
    }

    const amount = Math.floor((lineTotal / total) * normalizedSavings)
    allocated += amount
    return amount
  })
}

/**
 * DELETE /store/cart/add-bundle
 * Remove a bundle from the cart by its instance ID
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id, bundle_instance_id } = req.body as RemoveBundleRequestBody

    if (!cart_id || !bundle_instance_id) {
      return res.status(400).json({
        success: false,
        error: "cart_id and bundle_instance_id are required",
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartModuleService = req.scope.resolve(Modules.CART)

    // Get the cart with items
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "metadata", "items.*", "items.metadata"],
    })

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      })
    }

    // Find all line items belonging to this bundle instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartItems = (cart.items || []) as any[]
    const bundleLineItemIds: string[] = []

    for (const item of cartItems) {
      if (item && item.metadata?.bundle_instance_id === bundle_instance_id) {
        bundleLineItemIds.push(item.id)
      }
    }

    if (bundleLineItemIds.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bundle not found in cart",
      })
    }

    // Remove each line item
    await cartModuleService.deleteLineItems(bundleLineItemIds)

    // Update cart metadata to remove bundle
    const existingBundles = (cart.metadata?.bundles as Array<{
      instance_id: string
    }>) || []

    await cartModuleService.updateCarts([{
      id: cart_id,
      metadata: {
        ...(cart.metadata || {}),
        bundles: existingBundles.filter((b) => b.instance_id !== bundle_instance_id),
      },
    }])

    return res.json({
      success: true,
      message: "Bundle removed from cart",
      items_removed: bundleLineItemIds.length,
    })
  } catch (error) {
    console.error("Error removing bundle from cart:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove bundle from cart",
    })
  }
}

/**
 * POST /store/cart/add-bundle
 * Add a bundle to the cart
 *
 * This adds each bundle item as a line item with bundle metadata,
 * allowing the storefront to display them as a single grouped bundle.
 *
 * Returns:
 * - success: boolean
 * - bundle_name: string
 * - bundle_instance_id: string - unique ID for this bundle in cart
 * - bundle_pricing: { original_price, sale_price, savings }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id, bundle_id } = req.body as AddBundleRequestBody

    if (!cart_id || !bundle_id) {
      return res.status(400).json({
        success: false,
        error: "cart_id and bundle_id are required",
      })
    }

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartModuleService = req.scope.resolve(Modules.CART)

    // Get bundle with items
    const bundle = await bundleService.getBundleWithItems(bundle_id)

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: "Bundle not found",
      })
    }

    if (!bundle.is_active) {
      return res.status(400).json({
        success: false,
        error: "This bundle is no longer available",
      })
    }

    if (!bundle.items || bundle.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "This bundle has no items",
      })
    }

    // Get the cart to verify it exists
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "metadata"],
    })

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      })
    }

    // Generate a unique bundle instance ID (for grouping in cart)
    const bundleInstanceId = `${bundle_id}_${Date.now()}`

    const badgeText = bundleService.getBadgeDisplayText(bundle.badge)

    // Prepare items for the add-to-cart workflow
    // Each item includes metadata for bundle grouping
    const itemsToAdd = bundle.items.map((item, index) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      metadata: {
        bundle_id: bundle.id,
        bundle_instance_id: bundleInstanceId,
        bundle_name: bundle.name,
        bundle_item_index: index,
        bundle_total_items: bundle.items.length,
        bundle_badge: bundle.badge,
        bundle_badge_text: badgeText,
        product_title: item.product_title,
        variant_title: item.variant_title,
      },
    }))

    // Use the add-to-cart workflow to add all bundle items
    await addToCartWorkflow(req.scope).run({
      input: {
        cart_id,
        items: itemsToAdd,
      },
    })

    const { data: [cartWithItems] } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.id", "items.unit_price", "items.quantity", "items.metadata"],
    })

    if (!cartWithItems) {
      return res.status(404).json({
        success: false,
        error: "Cart not found after adding bundle",
      })
    }

    const bundleItems = (cartWithItems.items || []).filter(
      (item): item is NonNullable<typeof item> => {
        if (!item) {
          return false
        }
        const metadata = item.metadata as Record<string, unknown> | null
        return metadata?.bundle_instance_id === bundleInstanceId
      }
    )

    const lineTotals = bundleItems.map((item) => {
      const unitPrice = Number(item.unit_price || 0)
      const quantity = Number(item.quantity || 0)
      return unitPrice * quantity
    })

    const componentTotalCents = lineTotals.reduce((sum, value) => sum + value, 0)
    const pricing = bundleService.calculateBundlePricing(
      bundle,
      componentTotalCents
    )

    let bundleOriginalPrice = pricing.original_price
    let bundleSalePrice = pricing.sale_price
    let bundleSavings = pricing.savings
    let bundleSavingsPercent = pricing.savings_percent

    if (bundle.pricing_type === "fixed") {
      bundleOriginalPrice = componentTotalCents
      bundleSalePrice = pricing.sale_price
      bundleSavings = Math.max(bundleOriginalPrice - bundleSalePrice, 0)
      bundleSavingsPercent =
        bundleOriginalPrice > 0
          ? Math.round((bundleSavings / bundleOriginalPrice) * 100)
          : 0
    }

    const bundleDiscountCode = `bundle:${bundleInstanceId}`
    const allocations = allocateBundleDiscount(
      lineTotals,
      Math.max(0, bundleSavings)
    )

    const adjustments = bundleItems
      .map((item, index) => ({
        item_id: item.id,
        amount: allocations[index],
        code: bundleDiscountCode,
        description: "Bundle discount",
      }))
      .filter((adjustment) => adjustment.amount > 0)

    if (adjustments.length > 0) {
      await cartModuleService.addLineItemAdjustments(cart_id, adjustments)
    }

    const updatedLineItems = bundleItems.map((item) => ({
      id: item.id,
      metadata: {
        ...(item.metadata || {}),
        bundle_original_price: bundleOriginalPrice,
        bundle_sale_price: bundleSalePrice,
        bundle_savings: bundleSavings,
        bundle_savings_percent: bundleSavingsPercent,
        bundle_badge: bundle.badge,
        bundle_badge_text: badgeText,
      },
    }))

    if (updatedLineItems.length > 0) {
      await cartModuleService.updateLineItems(updatedLineItems)
    }

    // Update cart metadata to track bundle discounts
    const existingBundles = (cart.metadata?.bundles as Array<{
      bundle_id: string
      instance_id: string
      savings: number
    }>) || []

    await cartModuleService.updateCarts([{
      id: cart_id,
      metadata: {
        ...(cart.metadata || {}),
        bundles: [
          ...existingBundles,
          {
            bundle_id: bundle.id,
            instance_id: bundleInstanceId,
            name: bundle.name,
            savings: bundleSavings,
            original_price: bundleOriginalPrice,
            sale_price: bundleSalePrice,
            badge: bundle.badge,
            badge_text: badgeText,
          },
        ],
      },
    }])

    return res.json({
      success: true,
      bundle_name: bundle.name,
      bundle_instance_id: bundleInstanceId,
      items_added: bundle.items.length,
      bundle_pricing: {
        original_price: bundleOriginalPrice,
        sale_price: bundleSalePrice,
        savings: bundleSavings,
        savings_percent: bundleSavingsPercent,
      },
      message: `Bundle "${bundle.name}" added to cart`,
    })
  } catch (error) {
    console.error("Error adding bundle to cart:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add bundle to cart",
    })
  }
}
