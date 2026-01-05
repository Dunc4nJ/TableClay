import { Module } from "@medusajs/framework/utils"
import SalesTrackingModuleService from "./service"

export const SALES_TRACKING_MODULE = "salesTrackingModuleService"

export default Module(SALES_TRACKING_MODULE, {
  service: SalesTrackingModuleService,
})
