import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type AdditionalItemDiscountRequestBody = {
  cart_id: string
}

type LineItemAdjustmentPayload = {
  id?: string
  item_id: string
  amount: number
  code?: string
  description?: string
  promotion_id?: string
  provider_id?: string
}

type CartLineItem = {
  id: string
  unit_price?: number | string | null
  quantity?: number | null
  created_at?: string | null
  metadata?: Record<string, unknown> | null
  adjustments?: Array<{
    id?: string | null
    amount?: number | string | null
    code?: string | null
    description?: string | null
    promotion_id?: string | null
    provider_id?: string | null
    item_id?: string | null
  } | null> | null
}

const DISCOUNT_CODE = "additional-item-10"
const DISCOUNT_RATE = 0.1

const toTimestamp = (value?: string | null) => {
  if (!value) {
    return 0
  }

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const buildAdjustmentsToKeep = (items: CartLineItem[]) => {
  const adjustments: LineItemAdjustmentPayload[] = []

  for (const item of items) {
    const existingAdjustments = item.adjustments || []
    for (const adjustment of existingAdjustments) {
      if (!adjustment) {
        continue
      }
      if (adjustment.code === DISCOUNT_CODE) {
        continue
      }
      if (!adjustment.id) {
        continue
      }

      adjustments.push({
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

  return adjustments
}

const sumExistingAdjustments = (item: CartLineItem) => {
  const adjustments = item.adjustments || []
  let total = 0

  for (const adjustment of adjustments) {
    if (!adjustment) {
      continue
    }
    if (adjustment.code === DISCOUNT_CODE) {
      continue
    }
    total += Number(adjustment.amount || 0)
  }

  return total
}

/**
 * POST /store/cart/additional-item-discount
 * Apply 10% discount to all items after the first added item.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id } = req.body as AdditionalItemDiscountRequestBody

    if (!cart_id) {
      return res.status(400).json({
        success: false,
        error: "cart_id is required",
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartModuleService = req.scope.resolve(Modules.CART)

    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.id",
        "items.unit_price",
        "items.quantity",
        "items.created_at",
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

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      })
    }

    const cartItems = (cart.items || []) as CartLineItem[]
    const normalizedItems = cartItems.filter(Boolean)

    const adjustmentsToKeep = buildAdjustmentsToKeep(normalizedItems)

    if (normalizedItems.length === 0) {
      await cartModuleService.setLineItemAdjustments(cart_id, adjustmentsToKeep)

      return res.json({
        success: true,
        discounted_items: 0,
        excluded_items: 0,
        total_discount: 0,
      })
    }

    const sortedItems = [...normalizedItems].sort((first, second) => {
      const firstTime = toTimestamp(first.created_at)
      const secondTime = toTimestamp(second.created_at)
      if (firstTime !== secondTime) {
        return firstTime - secondTime
      }

      return String(first.id).localeCompare(String(second.id))
    })

    const firstItem = sortedItems[0]
    const excludedItemIds = new Set<string>()

    const firstMetadata = firstItem.metadata as Record<string, unknown> | null
    const bundleInstanceId =
      typeof firstMetadata?.bundle_instance_id === "string"
        ? firstMetadata.bundle_instance_id
        : undefined

    if (bundleInstanceId) {
      for (const item of sortedItems) {
        const metadata = item.metadata as Record<string, unknown> | null
        if (metadata?.bundle_instance_id === bundleInstanceId) {
          excludedItemIds.add(item.id)
        }
      }
    } else {
      excludedItemIds.add(firstItem.id)
    }

    const newAdjustments: LineItemAdjustmentPayload[] = []
    let totalDiscount = 0
    let discountedItems = 0

    for (const item of normalizedItems) {
      if (excludedItemIds.has(item.id)) {
        continue
      }

      const unitPrice = Number(item.unit_price || 0)
      const quantity = Number(item.quantity || 0)
      const baseTotal = unitPrice * quantity
      const existingAdjustments = sumExistingAdjustments(item)
      const effectiveTotal = Math.max(baseTotal - existingAdjustments, 0)
      const discountAmount = Math.floor(effectiveTotal * DISCOUNT_RATE)

      if (discountAmount <= 0) {
        continue
      }

      newAdjustments.push({
        item_id: item.id,
        amount: discountAmount,
        code: DISCOUNT_CODE,
        description: "Additional item 10% discount",
      })

      totalDiscount += discountAmount
      discountedItems += 1
    }

    await cartModuleService.setLineItemAdjustments(cart_id, [
      ...adjustmentsToKeep,
      ...newAdjustments,
    ])

    return res.json({
      success: true,
      discounted_items: discountedItems,
      excluded_items: excludedItemIds.size,
      total_discount: totalDiscount,
    })
  } catch (error) {
    console.error("Error applying additional item discount:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to apply additional item discount",
    })
  }
}

/**
 * DELETE /store/cart/additional-item-discount
 * Remove additional item discount from cart.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id } = req.body as AdditionalItemDiscountRequestBody

    if (!cart_id) {
      return res.status(400).json({
        success: false,
        error: "cart_id is required",
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartModuleService = req.scope.resolve(Modules.CART)

    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.id",
        "items.adjustments.id",
        "items.adjustments.amount",
        "items.adjustments.code",
        "items.adjustments.description",
        "items.adjustments.promotion_id",
        "items.adjustments.provider_id",
        "items.adjustments.item_id",
      ],
    })

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      })
    }

    const cartItems = (cart.items || []) as CartLineItem[]
    const normalizedItems = cartItems.filter(Boolean)

    const adjustmentsToKeep = buildAdjustmentsToKeep(normalizedItems)

    await cartModuleService.setLineItemAdjustments(cart_id, adjustmentsToKeep)

    return res.json({
      success: true,
      message: "Additional item discount removed",
    })
  } catch (error) {
    console.error("Error removing additional item discount:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove additional item discount",
    })
  }
}
