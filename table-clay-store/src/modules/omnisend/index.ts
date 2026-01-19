import { Module } from "@medusajs/framework/utils"
import OmnisendModuleService from "./service"

export const OMNISEND_MODULE = "omnisendModuleService"

export default Module(OMNISEND_MODULE, {
  service: OmnisendModuleService,
})

// Re-export types for consumers
export type { OmnisendModuleService }
export * from "./types"
