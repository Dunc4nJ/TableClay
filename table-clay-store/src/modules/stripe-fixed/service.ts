import StripeBase from "@medusajs/payment-stripe/dist/core/stripe-base"
import { PaymentProviderError, isPresent } from "@medusajs/framework/utils"

/**
 * Custom Stripe payment provider that fixes the 100x multiplication bug in Medusa v2.
 *
 * Problem: Medusa v2 passes amounts in cents (smallest unit), but the default
 * Stripe provider's getSmallestUnit() multiplies by 100 expecting dollars.
 * Result: $24.83 becomes $2,483.00 (100x wrong)
 *
 * Fix: Override payment methods to NOT multiply - amounts are already in cents.
 *
 * See: https://github.com/medusajs/medusa/issues/13160
 */
class StripeFixedProviderService extends StripeBase {
  static identifier = "stripe"

  get paymentIntentOptions() {
    return {}
  }

  /**
   * Override initiatePayment - amount is already in cents, don't multiply
   */
  async initiatePayment({
    currency_code,
    amount,
    data,
    context,
  }: {
    currency_code: string
    amount: number
    data?: Record<string, unknown>
    context?: Record<string, unknown>
  }) {
    const additionalParameters = this.normalizePaymentIntentParameters(data)

    const intentRequest: Record<string, unknown> = {
      amount: Math.round(amount), // Already in cents - just ensure integer
      currency: currency_code,
      metadata: {
        ...(data?.metadata as Record<string, string> ?? {}),
        session_id: data?.session_id as string,
      },
      ...additionalParameters,
    }

    if (context?.account_holder) {
      const accountHolder = context.account_holder as { data?: { id?: string } }
      intentRequest.customer = accountHolder?.data?.id
    }

    const sessionData = await this.executeWithRetry(() =>
      (this as any).stripe_.paymentIntents.create(intentRequest, {
        idempotencyKey: context?.idempotency_key as string,
      })
    )

    const isPaymentIntent = sessionData && "id" in sessionData
    return {
      id: isPaymentIntent ? sessionData.id : data?.session_id,
      ...this.getStatus(sessionData),
    }
  }

  /**
   * Override updatePayment - amount is already in cents, don't multiply
   */
  async updatePayment({
    data,
    currency_code,
    amount,
    context,
  }: {
    data?: Record<string, unknown>
    currency_code: string
    amount?: number
    context?: Record<string, unknown>
  }) {
    const amountNumeric = amount ? Math.round(amount) : undefined // Already in cents

    if (isPresent(amount) && data?.amount === amountNumeric) {
      return this.getStatus(data)
    }

    try {
      const id = data?.id as string
      const sessionData = await (this as any).stripe_.paymentIntents.update(
        id,
        { amount: amountNumeric },
        { idempotencyKey: context?.idempotency_key as string }
      )

      return this.getStatus(sessionData)
    } catch (e) {
      throw this.buildError("An error occurred in updatePayment", e as Error)
    }
  }

  /**
   * Override refundPayment - amount is already in cents, don't multiply
   */
  async refundPayment({
    amount,
    data,
    context,
  }: {
    amount: number
    data?: Record<string, unknown>
    context?: Record<string, unknown>
  }) {
    const id = data?.id as string
    if (!id) {
      throw new PaymentProviderError(
        "No payment intent ID provided while refunding payment"
      )
    }

    try {
      await (this as any).stripe_.refunds.create(
        {
          amount: Math.round(amount), // Already in cents
          payment_intent: id,
        },
        { idempotencyKey: context?.idempotency_key as string }
      )
    } catch (e) {
      throw this.buildError("An error occurred in refundPayment", e as Error)
    }

    return { data }
  }
}

export default StripeFixedProviderService
