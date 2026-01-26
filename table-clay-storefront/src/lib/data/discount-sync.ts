"use server"

import { sdk } from "@lib/config"
import { getCartId } from "./cookies"

/**
 * Syncs the additional item discount based on cart state.
 * Call this after any cart mutation (add, update, delete, bundle).
 */
export async function syncAdditionalItemDiscount(): Promise<void> {
  try {
    const cartId = await getCartId()
    if (!cartId) {
      return
    }

    const response = await sdk.client.fetch<{ success?: boolean }>(
      "/store/cart/additional-item-discount",
      {
        method: "POST",
        body: { cart_id: cartId },
        cache: "no-store",
      }
    )

    if (response?.success === false) {
      console.error("Failed to sync additional item discount")
    }
  } catch (error) {
    console.error("Error syncing additional item discount:", error)
  }
}

/**
 * Explicitly removes the additional item discount.
 * Call when cart drops below 2 items.
 */
export async function removeAdditionalItemDiscount(): Promise<void> {
  try {
    const cartId = await getCartId()
    if (!cartId) {
      return
    }

    const response = await sdk.client.fetch<{ success?: boolean }>(
      "/store/cart/additional-item-discount",
      {
        method: "DELETE",
        body: { cart_id: cartId },
        cache: "no-store",
      }
    )

    if (response?.success === false) {
      console.error("Failed to remove additional item discount")
    }
  } catch (error) {
    console.error("Error removing additional item discount:", error)
  }
}
