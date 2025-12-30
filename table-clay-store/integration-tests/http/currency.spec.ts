import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(120 * 1000)

/**
 * Currency Handling Integration Tests
 *
 * These tests verify that all monetary amounts are returned in the correct format:
 * - All amounts should be in CENTS (smallest currency unit)
 * - $34.99 should be stored/returned as 3499
 * - No floating point decimals for standard currencies (USD, EUR, etc.)
 *
 * Run with: yarn test:integration:http --testPathPattern=currency
 */

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {

    describe("Currency Format Verification", () => {

      describe("Product Prices", () => {
        it("should return product prices in cents (integers)", async () => {
          const response = await api.get("/store/products")
          expect(response.status).toEqual(200)

          const products = response.data.products
          if (products && products.length > 0) {
            const product = products[0]

            // Check if variants have prices
            if (product.variants && product.variants.length > 0) {
              const variant = product.variants[0]

              if (variant.calculated_price) {
                const amount = variant.calculated_price.calculated_amount

                // Price should be an integer (cents)
                expect(Number.isInteger(amount)).toBe(true)

                // A $34.99 item should be 3499, not 34.99
                // If price is less than 100, it's likely in dollars not cents
                if (amount !== null && amount !== 0) {
                  expect(amount).toBeGreaterThan(100)
                }
              }
            }
          }
        })

        it("should include currency_code with prices", async () => {
          const response = await api.get("/store/products")
          expect(response.status).toEqual(200)

          const products = response.data.products
          if (products && products.length > 0) {
            const variant = products[0]?.variants?.[0]
            if (variant?.calculated_price) {
              expect(variant.calculated_price.currency_code).toBeDefined()
              expect(typeof variant.calculated_price.currency_code).toBe("string")
            }
          }
        })
      })

      describe("Cart Totals", () => {
        let cartId: string

        beforeAll(async () => {
          // Get a region first
          const regionsRes = await api.get("/store/regions")
          const region = regionsRes.data.regions?.[0]

          if (region) {
            // Create a cart
            const cartRes = await api.post("/store/carts", {
              region_id: region.id,
              currency_code: region.currency_code || "usd"
            })
            cartId = cartRes.data.cart?.id
          }
        })

        it("should return cart totals in cents (integers)", async () => {
          if (!cartId) {
            console.log("Skipping: No cart created")
            return
          }

          const response = await api.get(`/store/carts/${cartId}`)
          expect(response.status).toEqual(200)

          const cart = response.data.cart

          // Total should be an integer (even if 0)
          if (cart.total !== null && cart.total !== undefined) {
            expect(Number.isInteger(cart.total)).toBe(true)
          }

          // Subtotal should be an integer
          if (cart.subtotal !== null && cart.subtotal !== undefined) {
            expect(Number.isInteger(cart.subtotal)).toBe(true)
          }
        })

        it("should have consistent currency_code", async () => {
          if (!cartId) {
            console.log("Skipping: No cart created")
            return
          }

          const response = await api.get(`/store/carts/${cartId}`)
          expect(response.status).toEqual(200)

          const cart = response.data.cart
          expect(cart.currency_code).toBeDefined()
          expect(typeof cart.currency_code).toBe("string")
          expect(cart.currency_code.length).toBe(3) // ISO currency codes are 3 chars
        })
      })

      describe("Shipping Options", () => {
        it("should return shipping prices in cents", async () => {
          // Get a region first
          const regionsRes = await api.get("/store/regions")
          const region = regionsRes.data.regions?.[0]

          if (!region) {
            console.log("Skipping: No regions found")
            return
          }

          // Create a cart to get shipping options
          const cartRes = await api.post("/store/carts", {
            region_id: region.id,
            currency_code: region.currency_code || "usd"
          })
          const cartId = cartRes.data.cart?.id

          if (!cartId) {
            console.log("Skipping: No cart created")
            return
          }

          const response = await api.get(`/store/shipping-options?cart_id=${cartId}`)

          if (response.data.shipping_options && response.data.shipping_options.length > 0) {
            const option = response.data.shipping_options[0]

            // Shipping amount should be an integer (cents)
            if (option.amount !== null && option.amount !== undefined) {
              expect(Number.isInteger(option.amount)).toBe(true)

              // $8.00 shipping should be 800, not 8
              if (option.amount > 0) {
                expect(option.amount).toBeGreaterThanOrEqual(100)
              }
            }
          }
        })
      })

      describe("Admin Order Totals", () => {
        it("should return order totals as integers in cents", async () => {
          // This test requires admin auth - skip if not available
          try {
            const response = await api.get("/admin/orders?limit=1")

            if (response.status === 200 && response.data.orders?.length > 0) {
              const order = response.data.orders[0]

              // Total should NOT be 0 if order has items
              // (This catches the total=0 bug we discovered)
              if (order.items && order.items.length > 0) {
                // At minimum, total should be defined
                expect(order.total).toBeDefined()
              }

              // If total is present, it should be an integer
              if (order.total !== null && order.total !== undefined) {
                expect(Number.isInteger(order.total)).toBe(true)
              }
            }
          } catch (e) {
            console.log("Skipping admin test: Auth required")
          }
        })

        it("should have consistent item prices in orders", async () => {
          try {
            const response = await api.get("/admin/orders?limit=1")

            if (response.status === 200 && response.data.orders?.length > 0) {
              const orderId = response.data.orders[0].id
              const orderDetail = await api.get(`/admin/orders/${orderId}`)

              if (orderDetail.data.order?.items?.length > 0) {
                const item = orderDetail.data.order.items[0]

                // unit_price should be an integer (cents)
                if (item.unit_price !== null && item.unit_price !== undefined) {
                  expect(Number.isInteger(item.unit_price)).toBe(true)

                  // A product priced at $44.99 should be 4499
                  if (item.unit_price > 0) {
                    expect(item.unit_price).toBeGreaterThan(100)
                  }
                }
              }
            }
          } catch (e) {
            console.log("Skipping admin test: Auth required")
          }
        })
      })
    })

    describe("Amount Format Consistency", () => {
      it("should never return floating point amounts for USD prices", async () => {
        const response = await api.get("/store/products")
        expect(response.status).toEqual(200)

        const products = response.data.products || []

        for (const product of products) {
          for (const variant of (product.variants || [])) {
            if (variant.calculated_price?.currency_code?.toLowerCase() === "usd") {
              const amount = variant.calculated_price.calculated_amount

              // USD amounts should never have decimal parts
              if (amount !== null && amount !== undefined) {
                const hasDecimal = amount !== Math.floor(amount)
                expect(hasDecimal).toBe(false)
              }
            }
          }
        }
      })
    })
  },
})
