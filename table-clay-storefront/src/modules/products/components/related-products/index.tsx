import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  // Limit to 4 products for a cleaner look
  const displayProducts = products.slice(0, 4)

  return (
    <section className="bg-cream-50 py-12 lg:py-16">
      <div className="content-container">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-display font-semibold text-ui-fg-base mb-3">
            Complete Your Collection
          </h2>
          <p className="text-ui-fg-subtle max-w-md mx-auto">
            Handcrafted pieces that pair beautifully together
          </p>
        </div>

        {/* Product grid - 4 columns on desktop, 2 on mobile */}
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {displayProducts.map((product) => (
            <li key={product.id}>
              <Product region={region} product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
