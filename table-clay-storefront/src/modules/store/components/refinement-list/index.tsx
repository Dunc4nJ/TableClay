"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { HttpTypes } from "@medusajs/types"

import SortProducts, { SortOptions } from "./sort-products"
import CollectionFilterButtons from "./collection-filter-buttons"

type RefinementListProps = {
  sortBy: SortOptions
  collections?: HttpTypes.StoreCollection[]
  activeCollectionId?: string | null
  showCollectionFilter?: boolean
  search?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  collections = [],
  activeCollectionId = null,
  showCollectionFilter = false,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "")
      if (value === null) {
        params.delete(name)
      } else {
        params.set(name, value)
      }
      // Reset to page 1 when changing filters
      if (name !== "page") {
        params.delete("page")
      }
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string | null) => {
    const query = createQueryString(name, value)
    const target = pathname ? (query ? `${pathname}?${query}` : pathname) : `?${query}`
    router.push(target)
  }

  const handleCollectionChange = (collectionId: string | null) => {
    setQueryParams("collection", collectionId)
  }

  return (
    <div className="flex flex-col gap-4 py-3 mb-4 small:py-4 small:mb-6 small:min-w-[220px] small:max-w-[240px] small:mr-6">
      {/* Sort Options */}
      <SortProducts
        sortBy={sortBy}
        setQueryParams={(name, value) => setQueryParams(name, value)}
        data-testid={dataTestId}
      />

      {/* Collection Filter - only show on main store page */}
      {showCollectionFilter && collections.length > 0 && (
        <CollectionFilterButtons
          collections={collections}
          activeCollectionId={activeCollectionId}
          onCollectionChange={handleCollectionChange}
        />
      )}
    </div>
  )
}

export default RefinementList
