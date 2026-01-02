import { listProducts } from "@lib/data/products"
import { getBundlesForProduct, type Bundle } from "@lib/data/bundles"
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
  // If bundles are provided, only fetch product
  // Otherwise, fetch product and bundles in parallel
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
  }).then(({ response }) => response.products[0])

  // Use provided bundles or fetch them
  const bundles = providedBundles ?? (await getBundlesForProduct(id))

  if (!product) {
    return null
  }

  return <ProductActions product={product} region={region} bundles={bundles} />
}
