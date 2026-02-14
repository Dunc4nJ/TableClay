import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-2 lg:gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-sm lg:text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-2xl leading-8 lg:text-3xl lg:leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {/* Desktop: inline description */}
        <Text
          className="hidden lg:block text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>

        {/* Mobile: collapsible description */}
        {product.description && (
          <details className="group lg:hidden border-t border-ui-border-base pt-3" data-testid="mobile-product-description">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-ui-fg-base select-none list-none [&::-webkit-details-marker]:hidden">
              <span>About this piece</span>
              <svg
                className="w-4 h-4 text-ui-fg-muted transition-transform duration-200 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <Text className="mt-3 text-sm text-ui-fg-subtle whitespace-pre-line leading-relaxed">
              {product.description}
            </Text>
          </details>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
