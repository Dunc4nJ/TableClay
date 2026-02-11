import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { OMNISEND_MODULE } from "../modules/omnisend"
import type OmnisendModuleService from "../modules/omnisend/service"

type CustomerRecord = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")

  try {
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { id: data.id },
    })

    const customer = customers?.[0] as CustomerRecord | undefined
    if (!customer) {
      console.log(`[customer-created] Customer not found: ${data.id}`)
      return
    }

    if (!customer.email) {
      console.log(`[customer-created] Customer has no email, skipping: ${data.id}`)
      return
    }

    const omnisendService: OmnisendModuleService = container.resolve(OMNISEND_MODULE)
    await omnisendService.createOrUpdateContact({
      email: customer.email,
      firstName: customer.first_name || undefined,
      lastName: customer.last_name || undefined,
      tags: ["medusa-customer", "new-customer"],
      customProperties: {
        medusa_customer_id: customer.id,
      },
    })

    console.log(`[customer-created] Synced OmniSend contact for ${customer.email}`)
  } catch (error) {
    // OmniSend sync should not block customer creation flow
    console.error(`[customer-created] Failed to sync customer ${data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
