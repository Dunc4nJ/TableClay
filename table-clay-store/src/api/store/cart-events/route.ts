import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { OMNISEND_MODULE } from "../../../modules/omnisend"
import type OmnisendModuleService from "../../../modules/omnisend/service"
import type { OmnisendCartProperties } from "../../../modules/omnisend/types"

interface CartEventBody {
  email: string
  cartData: OmnisendCartProperties
}

/**
 * POST /store/cart-events
 * Send a cart updated event to Omnisend for abandoned cart recovery.
 * Called by the storefront when a cart is modified with a known email.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email, cartData } = req.body as CartEventBody

    if (!email || !cartData?.cartID) {
      res.status(400).json({ error: "email and cartData.cartID are required" })
      return
    }

    const omnisendService: OmnisendModuleService = req.scope.resolve(OMNISEND_MODULE)

    await omnisendService.sendCartUpdatedEvent(email, cartData)

    res.json({ success: true })
  } catch (error) {
    // Log but don't fail - cart events should not block user operations
    console.error("[cart-events] Failed to send cart event to Omnisend:", error)
    res.json({ success: false })
  }
}
