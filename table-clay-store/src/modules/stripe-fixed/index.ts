import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import StripeFixedProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [StripeFixedProviderService],
})
