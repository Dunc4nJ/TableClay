import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type TipRequestBody = {
  tip_amount: number // Amount in cents (minor currency units)
}

/**
 * POST /store/cart/:id/tip
 * Add a tip amount to the cart metadata
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const { tip_amount } = req.body as TipRequestBody

    if (typeof tip_amount !== "number" || tip_amount < 0) {
      return res.status(400).json({
        success: false,
        error: "tip_amount must be a non-negative number (in cents)",
      })
    }

    const cartModule = req.scope.resolve(Modules.CART)

    // Update cart metadata with tip amount
    const [updatedCart] = await cartModule.updateCarts([
      {
        id,
        metadata: {
          tip_amount: tip_amount,
        },
      },
    ])

    return res.json({
      success: true,
      cart: {
        id: updatedCart.id,
        metadata: updatedCart.metadata,
      },
    })
  } catch (error) {
    console.error("Add tip error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add tip",
    })
  }
}

/**
 * GET /store/cart/:id/tip
 * Get the current tip amount from cart metadata
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    const cartModule = req.scope.resolve(Modules.CART)

    const cart = await cartModule.retrieveCart(id)

    const tipAmount = (cart.metadata as any)?.tip_amount || 0

    return res.json({
      success: true,
      tip_amount: tipAmount,
    })
  } catch (error) {
    console.error("Get tip error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get tip",
    })
  }
}

/**
 * DELETE /store/cart/:id/tip
 * Remove tip from cart
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    const cartModule = req.scope.resolve(Modules.CART)

    const [updatedCart] = await cartModule.updateCarts([
      {
        id,
        metadata: {
          tip_amount: 0,
        },
      },
    ])

    return res.json({
      success: true,
      cart: {
        id: updatedCart.id,
        metadata: updatedCart.metadata,
      },
    })
  } catch (error) {
    console.error("Remove tip error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove tip",
    })
  }
}
