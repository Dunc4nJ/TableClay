import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sdk } from "@lib/config"

type RouteParams = {
  params: Promise<{
    countryCode: string
    cartId: string
  }>
}

/**
 * Cart recovery endpoint for Omnisend abandoned cart emails.
 * Sets the cart cookie and redirects to checkout.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { countryCode, cartId } = await params

  if (!cartId) {
    // No cart ID provided, redirect to home
    return NextResponse.redirect(new URL(`/${countryCode}`, request.url))
  }

  try {
    // Verify the cart exists and is not completed
    const { cart } = await sdk.store.cart.retrieve(cartId)

    if (!cart || cart.completed_at) {
      // Cart doesn't exist or is already completed, redirect to home
      console.log(
        `[recover-cart] Cart ${cartId} not found or already completed`
      )
      return NextResponse.redirect(new URL(`/${countryCode}`, request.url))
    }

    // Set the cart cookie
    const cookieStore = await cookies()
    cookieStore.set("_medusa_cart_id", cartId, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })

    // Redirect to checkout
    return NextResponse.redirect(
      new URL(`/${countryCode}/checkout`, request.url)
    )
  } catch (error) {
    console.error(`[recover-cart] Error recovering cart ${cartId}:`, error)
    // On error, redirect to home
    return NextResponse.redirect(new URL(`/${countryCode}`, request.url))
  }
}
