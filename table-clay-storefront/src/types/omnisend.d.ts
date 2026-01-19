export {}

type OmnisendQueueItem = [string, ...unknown[]]

declare global {
  interface Window {
    omnisend?: OmnisendQueueItem[]
  }
}
