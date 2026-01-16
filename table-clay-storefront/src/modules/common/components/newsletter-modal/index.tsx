"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Fragment, useState, useEffect, useCallback } from "react"
import { useLocalStorageExpiry } from "@lib/hooks/use-local-storage"
import { subscribeToNewsletter } from "@lib/data/newsletter"
import X from "@modules/common/icons/x"

const NEWSLETTER_DISMISSED_KEY = "tableclay_newsletter_dismissed"
const NEWSLETTER_SUBSCRIBED_KEY = "tableclay_newsletter_subscribed"
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

type NewsletterModalProps = {
  /** Delay before showing the modal (in ms) */
  showDelay?: number
}

/**
 * Newsletter subscription modal
 * Shows a full-screen popup offering free shipping for email signup
 * Tracks dismissal in localStorage for 30 days
 */
export default function NewsletterModal({
  showDelay = 1500,
}: NewsletterModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [discountCode, setDiscountCode] = useState<string | null>(null)

  // Check if previously dismissed (within 30 days)
  const [wasDismissed, markDismissed] = useLocalStorageExpiry(
    NEWSLETTER_DISMISSED_KEY,
    DISMISS_DURATION_MS
  )

  // Check if already subscribed (never show again)
  const [wasSubscribed, markSubscribed] = useLocalStorageExpiry(
    NEWSLETTER_SUBSCRIBED_KEY,
    365 * 24 * 60 * 60 * 1000 // 1 year
  )

  // Show modal after delay if not dismissed/subscribed
  useEffect(() => {
    if (wasDismissed || wasSubscribed) {
      return
    }

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, showDelay)

    return () => clearTimeout(timer)
  }, [showDelay, wasDismissed, wasSubscribed])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    markDismissed()
  }, [markDismissed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await subscribeToNewsletter({
        email,
        source: "popup",
      })

      if (result.success) {
        setSuccess(true)
        setDiscountCode(result.subscriber?.discount_code || null)
        markSubscribed()
        // Auto-close after showing success
        setTimeout(() => {
          setIsOpen(false)
        }, 5000)
      } else {
        setError(result.message || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, handleClose])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[100]"
        onClose={handleClose}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#2c1810]/45 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-cream-200 p-8 sm:p-12 text-center shadow-2xl transition-all">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 text-ui-fg-muted hover:text-ui-fg-base transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-full"
                  aria-label="Close newsletter popup"
                >
                  <X size={24} />
                </button>

                {!success ? (
                  <>
                    {/* Header */}
                    <Dialog.Title className="text-4xl sm:text-5xl font-display font-semibold text-ui-fg-base mb-4">
                      Free Shipping
                    </Dialog.Title>

                    <Dialog.Description className="text-ui-fg-subtle text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
                      New to Table Clay? Get{" "}
                      <span className="font-semibold text-ui-fg-base">
                        free shipping on your first order
                      </span>{" "}
                      when you subscribe to our newsletter.
                    </Dialog.Description>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <label
                          htmlFor="newsletter-email"
                          className="block text-xs font-medium uppercase tracking-wider text-ui-fg-muted text-left mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          id="newsletter-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          disabled={isLoading}
                          className="w-full px-4 py-3 text-ui-fg-base bg-ui-bg-component border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-ui-fg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          autoFocus
                        />
                      </div>

                      {error && (
                        <p className="text-red-600 text-sm">{error}</p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full py-3 px-6 bg-brand-800 hover:bg-brand-900 text-white font-medium uppercase tracking-wider text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Subscribing..." : "Continue"}
                      </button>
                    </form>

                    {/* Limited time message */}
                    <p className="mt-6 text-xs text-ui-fg-muted italic">
                      Limited time offer - subscribe today!
                    </p>

                    {/* Privacy note */}
                    <p className="mt-4 text-xs text-ui-fg-muted">
                      By subscribing, you agree to receive marketing emails.
                      Unsubscribe anytime.
                    </p>
                  </>
                ) : (
                  /* Success state */
                  <div className="py-4">
                    <div className="text-5xl mb-4">
                      <span role="img" aria-label="celebration">
                        🎉
                      </span>
                    </div>

                    <Dialog.Title className="text-3xl sm:text-4xl font-display font-semibold text-ui-fg-base mb-4">
                      Welcome to Table Clay!
                    </Dialog.Title>

                    <Dialog.Description className="text-ui-fg-subtle text-base mb-6 max-w-md mx-auto">
                      Check your email for your exclusive free shipping code.
                    </Dialog.Description>

                    {discountCode && (
                      <div className="bg-ui-bg-component border-2 border-dashed border-brand-500 rounded-lg p-6 mb-6 max-w-xs mx-auto">
                        <p className="text-xs uppercase tracking-wider text-ui-fg-muted mb-2">
                          Your Free Shipping Code
                        </p>
                        <p className="text-2xl font-bold tracking-widest text-ui-fg-base">
                          {discountCode}
                        </p>
                      </div>
                    )}

                    <p className="text-sm text-ui-fg-muted">
                      Use this code at checkout for free shipping on your first order!
                    </p>

                    <button
                      onClick={handleClose}
                      className="mt-6 py-2 px-6 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
