import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

type BreakBundleRequestBody = {
  cart_id: string
  bundle_instance_id: string
  line_item_id?: string
}

type LineItemAdjustmentPayload = {
  id: string
  item_id: string
  amount: number
  code?: string
  description?: string
  promotion_id?: string
  provider_id?: string
}

const stripBundleMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata) {
    return null
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !key.startsWith("bundle_"))
  )
}

/**
 * POST /store/cart/break-bundle
 * Break a bundle when a single line item is removed.
 * - Removes bundle discount adjustments
 * - Clears bundle metadata from remaining items
 * - Removes bundle entry from cart metadata
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id, bundle_instance_id, line_item_id } =
      req.body as BreakBundleRequestBody

    if (!cart_id || !bundle_instance_id) {
      return res.status(400).json({
        success: false,
        error: "cart_id and bundle_instance_id are required",
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartModuleService = req.scope.resolve(Modules.CART)

    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "metadata", "items.id", "items.metadata"],
    })

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      })
    }

    const bundleItems = (cart.items || []).filter(
      (item): item is NonNullable<typeof item> => {
        if (!item) {
          return false
        }
        const metadata = item.metadata as Record<string, unknown> | null
        return metadata?.bundle_instance_id === bundle_instance_id
      }
    )

    if (bundleItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bundle not found in cart",
      })
    }

    if (line_item_id) {
      const isBundleItem = bundleItems.some((item) => item.id === line_item_id)
      if (!isBundleItem) {
        return res.status(400).json({
          success: false,
          error: "line_item_id is not part of the provided bundle instance",
        })
      }

      await cartModuleService.deleteLineItems([line_item_id])
    }

    const { data: [updatedCart] } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "metadata",
        "items.id",
        "items.metadata",
        "items.adjustments.id",
        "items.adjustments.amount",
        "items.adjustments.code",
        "items.adjustments.description",
        "items.adjustments.promotion_id",
        "items.adjustments.provider_id",
        "items.adjustments.item_id",
      ],
    })

    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found after update",
      })
    }

    const bundleDiscountCode = `bundle:${bundle_instance_id}`

    const adjustmentsToKeep: LineItemAdjustmentPayload[] = []
    for (const item of updatedCart.items || []) {
      if (!item) {
        continue
      }
      const adjustments = item.adjustments || []
      for (const adjustment of adjustments) {
        if (!adjustment) {
          continue
        }
        if (adjustment.code === bundleDiscountCode) {
          continue
        }
        adjustmentsToKeep.push({
          id: adjustment.id,
          item_id: adjustment.item_id || item.id,
          amount: Number(adjustment.amount || 0),
          code: adjustment.code ?? undefined,
          description: adjustment.description ?? undefined,
          promotion_id: adjustment.promotion_id ?? undefined,
          provider_id: adjustment.provider_id ?? undefined,
        })
      }
    }

    await cartModuleService.setLineItemAdjustments(
      cart_id,
      adjustmentsToKeep
    )

    const remainingBundleItems = (updatedCart.items || []).filter(
      (item): item is NonNullable<typeof item> => {
        if (!item) {
          return false
        }
        const metadata = item.metadata as Record<string, unknown> | null
        return metadata?.bundle_instance_id === bundle_instance_id
      }
    )

    if (remainingBundleItems.length > 0) {
      const itemsToUpdate = remainingBundleItems.map((item) => ({
        id: item.id,
        metadata: stripBundleMetadata(item.metadata as Record<string, unknown> | null),
      }))

      await cartModuleService.updateLineItems(itemsToUpdate)
    }

    const existingBundles = (updatedCart.metadata?.bundles as Array<{
      instance_id: string
    }>) || []

    await cartModuleService.updateCarts([{
      id: cart_id,
      metadata: {
        ...(updatedCart.metadata || {}),
        bundles: existingBundles.filter((b) => b.instance_id !== bundle_instance_id),
      },
    }])

    return res.json({
      success: true,
      message: "Bundle broken and pricing reverted",
      items_updated: remainingBundleItems.length,
    })
  } catch (error) {
    console.error("Error breaking bundle:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to break bundle",
    })
  }
}
