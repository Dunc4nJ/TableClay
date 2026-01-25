import { BigNumberInput } from "@medusajs/framework/types"

export interface CreateShippingMethodAdjustmentDTO {
  shipping_method_id: string
  code: string
  amount: BigNumberInput
  is_tax_inclusive?: boolean
  description?: string
  promotion_id?: string
  provider_id?: string
}

export interface UpdateShippingMethodAdjustmentDTO {
  id: string
  code?: string
  amount?: BigNumberInput
  is_tax_inclusive?: boolean
  description?: string
  promotion_id?: string
  provider_id?: string
}
