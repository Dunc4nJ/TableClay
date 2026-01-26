"use server"

import { getCartId } from "./cookies"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

/**
 * Syncs the additional item discount based on cart state.
 * Call this after any cart mutation (add, update, delete, bundle).
 */
export async function syncAdditionalItemDiscount(): Promise<void> {
  try {
    const cartId = await getCartId()
    if (!cartId || !BACKEND_URL) {
      return
    }

    const response = await fetch(
      `${BACKEND_URL}/store/cart/additional-item-discount`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart_id: cartId }),
        cache: "no-store",
      }
    )

    if (!response.ok) {
      console.error("Failed to sync additional item discount:", response.status)
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
    if (!cartId || !BACKEND_URL) {
      return
    }

    const response = await fetch(
      `${BACKEND_URL}/store/cart/additional-item-discount`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart_id: cartId }),
        cache: "no-store",
      }
    )

    if (!response.ok) {
      console.error("Failed to remove additional item discount:", response.status)
    }
  } catch (error) {
    console.error("Error removing additional item discount:", error)
  }
}
