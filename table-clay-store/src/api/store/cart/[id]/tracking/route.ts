import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type TrackingMetadataRequest = {
  event_id: string
  _fbp?: string
  _fbc?: string
  ttclid?: string
  _ttp?: string
  client_ip?: string
  client_user_agent?: string
}

const normalizeValue = (value?: string) => {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const getClientIp = (req: MedusaRequest): string | undefined => {
  const forwardedFor = req.headers["x-forwarded-for"]

  if (typeof forwardedFor === "string") {
    const [first] = forwardedFor.split(",")
    return first?.trim() || undefined
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.trim() || undefined
  }

  const maybeIp =
    (req as { ip?: string }).ip ||
    (req as { connection?: { remoteAddress?: string } }).connection
      ?.remoteAddress ||
    (req as { socket?: { remoteAddress?: string } }).socket?.remoteAddress

  return typeof maybeIp === "string" ? maybeIp : undefined
}

/**
 * POST /store/cart/:id/tracking
 * Save tracking metadata to cart metadata for server-side event subscribers
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const body = req.body as TrackingMetadataRequest

    if (!body?.event_id || typeof body.event_id !== "string") {
      return res.status(400).json({
        success: false,
        error: "event_id is required",
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const cartModule = req.scope.resolve(Modules.CART)

    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id },
      fields: ["id", "metadata"],
    })

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      })
    }

    const existingMetadata = cart.metadata || {}
    const trackingMetadata: Record<string, unknown> = {
      event_id: body.event_id,
    }

    const fbp = normalizeValue(body._fbp)
    const fbc = normalizeValue(body._fbc)
    const ttclid = normalizeValue(body.ttclid)
    const ttp = normalizeValue(body._ttp)
    const clientIp = normalizeValue(body.client_ip) || getClientIp(req)
    const userAgent =
      normalizeValue(body.client_user_agent) ||
      (typeof req.headers["user-agent"] === "string"
        ? req.headers["user-agent"]
        : undefined)

    if (fbp) {
      trackingMetadata._fbp = fbp
    }

    if (fbc) {
      trackingMetadata._fbc = fbc
    }

    if (ttclid) {
      trackingMetadata.ttclid = ttclid
    }

    if (ttp) {
      trackingMetadata._ttp = ttp
    }

    if (clientIp) {
      trackingMetadata.client_ip = clientIp
    }

    if (userAgent) {
      trackingMetadata.client_user_agent = userAgent
    }

    await cartModule.updateCarts([
      {
        id,
        metadata: {
          ...existingMetadata,
          ...trackingMetadata,
        },
      },
    ])

    return res.json({ success: true })
  } catch (error) {
    console.error("Tracking metadata error:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save tracking metadata",
    })
  }
}
