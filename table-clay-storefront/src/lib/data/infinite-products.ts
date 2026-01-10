"use server"

import { listProductsWithSort } from "./products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

const PRODUCT_LIMIT = 12

type FetchMoreProductsParams = {
  page: number
  sortBy: SortOptions
  countryCode: string
  collectionId?: string
  categoryId?: string
  limit?: number
}

type FetchMoreProductsResult = {
  products: HttpTypes.StoreProduct[]
  count: number
  hasMore: boolean
}

export async function fetchMoreProducts({
  page,
  sortBy,
  countryCode,
  collectionId,
  categoryId,
  limit = PRODUCT_LIMIT,
}: FetchMoreProductsParams): Promise<FetchMoreProductsResult> {
  const queryParams: {
    limit: number
    collection_id?: string[]
    category_id?: string[]
    order?: string
  } = {
    limit,
  }

  if (collectionId) {
    queryParams.collection_id = [collectionId]
  }

  if (categoryId) {
    queryParams.category_id = [categoryId]
  }

  if (sortBy === "created_at") {
    queryParams.order = "created_at"
  }

  const result = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalLoaded = page * limit
  const hasMore = totalLoaded < result.response.count

  return {
    products: result.response.products,
    count: result.response.count,
    hasMore,
  }
}
