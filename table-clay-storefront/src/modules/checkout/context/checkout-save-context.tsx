"use client"

import {
  createContext,
  useContext,
  useTransition,
  ReactNode,
  TransitionStartFunction,
} from "react"

type CheckoutSaveContextType = {
  isPending: boolean
  startTransition: TransitionStartFunction
}

const CheckoutSaveContext = createContext<CheckoutSaveContextType | null>(null)

export function CheckoutSaveProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition()

  return (
    <CheckoutSaveContext.Provider value={{ isPending, startTransition }}>
      {children}
    </CheckoutSaveContext.Provider>
  )
}

export function useCheckoutSave() {
  const context = useContext(CheckoutSaveContext)
  if (!context) {
    throw new Error("useCheckoutSave must be used within CheckoutSaveProvider")
  }
  return context
}
