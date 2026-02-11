import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { OMNISEND_MODULE } from "../../../../modules/omnisend"
import type OmnisendModuleService from "../../../../modules/omnisend/service"

type SyncContactsBody = {
  batch_size?: number
  delay_ms?: number
}

/**
 * POST /admin/omnisend/sync-contacts
 * Batch sync all Medusa customers to OmniSend contacts.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { batch_size, delay_ms } = (req.body || {}) as SyncContactsBody
    if (batch_size !== undefined && (!Number.isInteger(batch_size) || batch_size <= 0)) {
      return res.status(400).json({
        success: false,
        provider: "omnisend",
        error: "batch_size must be a positive integer",
      })
    }
    if (delay_ms !== undefined && (!Number.isInteger(delay_ms) || delay_ms < 0)) {
      return res.status(400).json({
        success: false,
        provider: "omnisend",
        error: "delay_ms must be a non-negative integer",
      })
    }

    const omnisendService: OmnisendModuleService = req.scope.resolve(OMNISEND_MODULE)

    const result = await omnisendService.syncAllContacts({
      batchSize: batch_size,
      delayMs: delay_ms,
      tags: ["medusa-customer"],
    })

    return res.json({
      success: true,
      provider: "omnisend",
      ...result,
    })
  } catch (error) {
    console.error("[admin/omnisend/sync-contacts] Error:", error)
    return res.status(500).json({
      success: false,
      provider: "omnisend",
      error: error instanceof Error ? error.message : "Failed to sync contacts",
    })
  }
}
