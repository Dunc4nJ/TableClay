import { listProducts } from "@lib/data/products"
import { getBundlesForProduct, type Bundle } from "@lib/data/bundles"
import { getStoreSettings, type BundlePromoSettings } from "@lib/data/settings"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * Uses provided bundles or fetches them if not provided.
 */
export default async function ProductActionsWrapper({
  id,
  region,
  bundles: providedBundles,
}: {
  id: string
  region: HttpTypes.StoreRegion
  bundles?: Bundle[]
}) {
  // Fetch product, bundles (if not provided), and settings in parallel
  const [product, fetchedBundles, settings] = await Promise.all([
    listProducts({
      queryParams: { id: [id] },
      regionId: region.id,
    }).then(({ response }) => response.products[0]),
    providedBundles ? Promise.resolve(providedBundles) : getBundlesForProduct(id),
    getStoreSettings(),
  ])

  if (!product) {
    return null
  }

  return (
    <ProductActions
      product={product}
      region={region}
      bundles={fetchedBundles}
      bundleSettings={settings}
    />
  )
}
