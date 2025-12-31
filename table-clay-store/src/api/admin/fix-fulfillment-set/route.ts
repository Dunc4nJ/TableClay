import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFulfillmentModuleService } from "@medusajs/framework/types"

/**
 * POST /admin/fix-fulfillment-set
 *
 * One-time fix endpoint to update the fulfillment set type from null to 'shipping'.
 * This fixes the issue where fulfillments are created with requires_shipping: false,
 * which prevents the "Mark as shipped" button from appearing in the admin UI.
 *
 * Run once after deployment:
 * curl -X POST https://tableclay-production.up.railway.app/admin/fix-fulfillment-set \
 *   -H "Authorization: Bearer <token>"
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const FULFILLMENT_SET_ID = "fuset_01KD1ZBZVF24CD05NRCAG166WJ"

  try {
    const fulfillmentModule: IFulfillmentModuleService = req.scope.resolve(
      Modules.FULFILLMENT
    )

    // Get current fulfillment set
    const [currentSet] = await fulfillmentModule.listFulfillmentSets({
      id: FULFILLMENT_SET_ID,
    })

    if (!currentSet) {
      return res.status(404).json({
        success: false,
        error: `Fulfillment set ${FULFILLMENT_SET_ID} not found`,
      })
    }

    console.log("[Fix] Current fulfillment set:", {
      id: currentSet.id,
      name: currentSet.name,
      type: currentSet.type,
    })

    // Check if already fixed
    if (currentSet.type === "shipping") {
      return res.json({
        success: true,
        message: "Fulfillment set already has type 'shipping'",
        fulfillment_set: {
          id: currentSet.id,
          name: currentSet.name,
          type: currentSet.type,
        },
      })
    }

    // Update the fulfillment set type
    const updatedSet = await fulfillmentModule.updateFulfillmentSets({
      id: FULFILLMENT_SET_ID,
      type: "shipping",
      name: "Table Clay Shipping",
    })

    console.log("[Fix] Updated fulfillment set:", {
      id: updatedSet.id,
      name: updatedSet.name,
      type: updatedSet.type,
    })

    return res.json({
      success: true,
      message: "Fulfillment set type updated to 'shipping'",
      before: {
        id: currentSet.id,
        name: currentSet.name,
        type: currentSet.type,
      },
      after: {
        id: updatedSet.id,
        name: updatedSet.name,
        type: updatedSet.type,
      },
    })
  } catch (error) {
    console.error("[Fix] Error updating fulfillment set:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * GET /admin/fix-fulfillment-set
 *
 * Check current fulfillment set configuration
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const FULFILLMENT_SET_ID = "fuset_01KD1ZBZVF24CD05NRCAG166WJ"

  try {
    const fulfillmentModule: IFulfillmentModuleService = req.scope.resolve(
      Modules.FULFILLMENT
    )

    const [currentSet] = await fulfillmentModule.listFulfillmentSets({
      id: FULFILLMENT_SET_ID,
    })

    if (!currentSet) {
      return res.status(404).json({
        success: false,
        error: `Fulfillment set ${FULFILLMENT_SET_ID} not found`,
      })
    }

    const needsFix = currentSet.type !== "shipping"

    return res.json({
      success: true,
      needs_fix: needsFix,
      fulfillment_set: {
        id: currentSet.id,
        name: currentSet.name,
        type: currentSet.type,
      },
      message: needsFix
        ? "Fulfillment set needs fix - POST to this endpoint to fix"
        : "Fulfillment set is correctly configured",
    })
  } catch (error) {
    console.error("[Fix] Error checking fulfillment set:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
