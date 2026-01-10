import { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import InfiniteProductsWrapper from "./infinite-products-wrapper"

const StoreTemplate = ({
  sortBy,
  countryCode,
  collections,
  collectionId,
}: {
  sortBy?: SortOptions
  countryCode: string
  collections?: HttpTypes.StoreCollection[]
  collectionId?: string | null
}) => {
  const sort = sortBy || "created_at"

  // Find active collection title for the heading
  const activeCollection = collectionId
    ? collections?.find((c) => c.id === collectionId)
    : null

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList
        sortBy={sort}
        collections={collections}
        activeCollectionId={collectionId || null}
        showCollectionFilter={true}
      />
      <div className="w-full">
        <div className="mb-6 text-2xl-semi">
          <h1 data-testid="store-page-title">
            {activeCollection ? activeCollection.title : "All products"}
          </h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <InfiniteProductsWrapper
            sortBy={sort}
            countryCode={countryCode}
            collectionId={collectionId || undefined}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
