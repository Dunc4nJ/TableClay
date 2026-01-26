import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntities } from "@medusajs/framework/http"
import type {
  HttpTypes,
  MedusaPricingContext,
  QueryContextType,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"
import { STORE_SETTINGS_MODULE } from "../../../../modules/store-settings"
import { SETTING_KEYS } from "../../../../modules/store-settings/service"
import type StoreSettingsModuleService from "../../../../modules/store-settings/service"

const DEFAULT_STORE_PRODUCT_FIELDS = [
  "id",
  "title",
  "subtitle",
  "description",
  "handle",
  "is_giftcard",
  "discountable",
  "thumbnail",
  "collection_id",
  "type_id",
  "weight",
  "length",
  "height",
  "width",
  "hs_code",
  "origin_country",
  "mid_code",
  "material",
  "created_at",
  "updated_at",
  "*type",
  "*collection",
  "*options",
  "*options.values",
  "*tags",
  "*images",
  "*variants",
  "*variants.options",
]

const parseStoredOrder = (value: string | null): string[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((id): id is string => typeof id === "string")
  } catch {
    return []
  }
}

const parseCsvParam = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) =>
        typeof entry === "string" ? entry.split(",") : []
      )
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

const getQueryParam = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string")
    return typeof first === "string" ? first : undefined
  }

  return undefined
}

const pickRandom = <T,>(items: T[]): T | null => {
  if (items.length === 0) return null
  const index = Math.floor(Math.random() * items.length)
  return items[index] ?? null
}

const pickRandomAndRemove = <T extends { id: string }>(
  items: T[],
  usedIds: Set<string>
): T | null => {
  const available = items.filter((item) => !usedIds.has(item.id))
  if (available.length === 0) return null
  const chosen = pickRandom(available)
  if (!chosen) return null
  usedIds.add(chosen.id)
  return chosen
}

const buildPricingContext = async (
  req: MedusaRequest,
  regionId: string
): Promise<MedusaPricingContext | null> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [region] } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { id: regionId },
  })

  if (!region) {
    return null
  }

  const pricingContext: MedusaPricingContext = {
    region_id: region.id,
    currency_code: region.currency_code,
  }

  const authContext = (req as { auth_context?: { actor_id?: string } })
    .auth_context
  if (authContext?.actor_id) {
    const { data: customerGroups } = await refetchEntities({
      entity: "customer_group",
      idOrFilter: { customers: { id: authContext.actor_id } },
      scope: req.scope,
      fields: ["id"],
    })

    pricingContext.customer = { groups: [] }
    customerGroups.forEach((group) => {
      pricingContext.customer?.groups?.push({ id: group.id })
    })
  }

  return pricingContext
}

/**
 * GET /store/products/recommended
 * Returns up to 3 curated products based on admin-defined product order.
 *
 * Query params:
 * - region_id: required for pricing calculation
 * - collection_id: optional, prefers slot 1 from this collection
 * - exclude_product_ids: optional comma-separated product IDs to exclude
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const regionId = getQueryParam(req.query.region_id)

    if (!regionId) {
      return res.status(400).json({
        error: "region_id query parameter is required",
      })
    }

    const collectionId = getQueryParam(req.query.collection_id)

    const excludeIds = new Set(
      parseCsvParam(req.query.exclude_product_ids).filter(Boolean)
    )

    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    const stored = await settingsService.getSetting(SETTING_KEYS.PRODUCT_ORDER)
    const productOrder = parseStoredOrder(stored)

    if (productOrder.length === 0) {
      res.setHeader("Cache-Control", "no-store")
      return res.json({
        products: [],
        count: 0,
        offset: 0,
        limit: 3,
      })
    }

    const topProductIds: string[] = []
    const seen = new Set<string>()

    for (const id of productOrder) {
      if (!id || seen.has(id)) {
        continue
      }
      seen.add(id)
      if (excludeIds.has(id)) {
        continue
      }
      topProductIds.push(id)
      if (topProductIds.length >= 20) {
        break
      }
    }

    if (topProductIds.length === 0) {
      res.setHeader("Cache-Control", "no-store")
      return res.json({
        products: [],
        count: 0,
        offset: 0,
        limit: 3,
      })
    }

    const pricingContext = await buildPricingContext(req, regionId)

    if (!pricingContext) {
      return res.status(400).json({
        error: `Region with id ${regionId} not found`,
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const context: QueryContextType = {
      variants: {
        calculated_price: QueryContext(pricingContext),
      },
    }

    const { data: products = [] } = await query.graph(
      {
        entity: "product",
        fields: [...DEFAULT_STORE_PRODUCT_FIELDS, "*variants.calculated_price"],
        filters: {
          id: topProductIds,
          status: "published",
        },
        context,
      },
      {
        cache: {
          enable: false,
        },
      }
    )

    const productMap = new Map<string, HttpTypes.StoreProduct>()
    products.forEach((product) => {
      productMap.set(product.id, product as HttpTypes.StoreProduct)
    })

    const orderedProducts = topProductIds
      .map((id) => productMap.get(id))
      .filter(Boolean) as HttpTypes.StoreProduct[]

    if (orderedProducts.length === 0) {
      res.setHeader("Cache-Control", "no-store")
      return res.json({
        products: [],
        count: 0,
        offset: 0,
        limit: 3,
      })
    }

    const topFive = orderedProducts.slice(0, 5)
    const usedIds = new Set<string>()
    const selected: HttpTypes.StoreProduct[] = []

    let slot1Candidates = topFive
    if (collectionId) {
      const collectionMatches = topFive.filter(
        (product) => product.collection_id === collectionId
      )
      if (collectionMatches.length > 0) {
        slot1Candidates = collectionMatches
      }
    }

    const slot1 = pickRandom(slot1Candidates) || pickRandom(orderedProducts)
    if (slot1) {
      usedIds.add(slot1.id)
      selected.push(slot1)
    }

    while (selected.length < 3) {
      const nextFromTopFive = pickRandomAndRemove(topFive, usedIds)
      if (!nextFromTopFive) {
        break
      }
      selected.push(nextFromTopFive)
    }

    if (selected.length < 3) {
      const fallbackPool = orderedProducts
      while (selected.length < 3) {
        const nextFallback = pickRandomAndRemove(fallbackPool, usedIds)
        if (!nextFallback) {
          break
        }
        selected.push(nextFallback)
      }
    }

    res.setHeader("Cache-Control", "no-store")

    return res.json({
      products: selected,
      count: selected.length,
      offset: 0,
      limit: 3,
    })
  } catch (error) {
    console.error("Error fetching recommended products:", error)
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch recommended products",
    })
  }
}
