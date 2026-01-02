import { listProducts } from "@lib/data/products"
import { getBundlesForProduct } from "@lib/data/bundles"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * Also fetches bundles if available.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  // Fetch product and bundles in parallel
  const [product, bundles] = await Promise.all([
    listProducts({
      queryParams: { id: [id] },
      regionId: region.id,
    }).then(({ response }) => response.products[0]),
    getBundlesForProduct(id),
  ])

  if (!product) {
    return null
  }

  return <ProductActions product={product} region={region} bundles={bundles} />
}
