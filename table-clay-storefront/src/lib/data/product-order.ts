"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

type ProductOrderResponse = {
  success: boolean
  product_order: string[]
  error?: string
}

export async function getProductOrder(): Promise<string[]> {
  const next = {
    ...(await getCacheOptions("product-order")),
    revalidate: 60,
  }

  try {
    const response = await sdk.client.fetch<ProductOrderResponse>(
      "/store/product-order",
      {
        method: "GET",
        next,
      }
    )

    if (response.success && Array.isArray(response.product_order)) {
      return response.product_order
    }

    return []
  } catch (error) {
    console.error("Error fetching product order:", error)
    return []
  }
}
