"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Fragment, useState, useEffect, useCallback, useRef } from "react"
import { useLocalStorageExpiry } from "@lib/hooks/use-local-storage"
import { subscribeToNewsletter } from "@lib/data/newsletter"
import { CheckCircleSolid } from "@medusajs/icons"
import X from "@modules/common/icons/x"

// Exported for use by floating discount retrieval widget
export const NEWSLETTER_DISMISSED_KEY = "tableclay_newsletter_dismissed"
export const NEWSLETTER_SUBSCRIBED_KEY = "tableclay_newsletter_subscribed"
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

type NewsletterModalProps = {
  /** Delay before showing the modal (in ms) */
  showDelay?: number
  /** Force modal to open immediately, bypassing localStorage checks and delay */
  forceOpen?: boolean
  /** Callback when modal opens (for external control) */
  onOpen?: () => void
  /** Callback when modal closes (for external control) */
  onClose?: () => void
}

/**
 * Newsletter subscription modal
 * Shows a full-screen popup offering free shipping for email signup
 * Tracks dismissal in localStorage for 30 days
 */
export default function NewsletterModal({
  showDelay = 1500,
  forceOpen = false,
  onOpen,
  onClose,
}: NewsletterModalProps) {
  const [isOpen, setIsOpen] = useState(forceOpen)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [discountCode, setDiscountCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const wasOpenRef = useRef(false)

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

  // Sync isOpen with forceOpen prop changes (for external control)
  useEffect(() => {
    setIsOpen(forceOpen)
  }, [forceOpen])

  // Show modal after delay if not dismissed/subscribed (skip if forceOpen)
  useEffect(() => {
    if (forceOpen || wasDismissed || wasSubscribed) {
      return
    }

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, showDelay)

    return () => clearTimeout(timer)
  }, [showDelay, wasDismissed, wasSubscribed, forceOpen])

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      onOpen?.()
    }
    wasOpenRef.current = isOpen
  }, [isOpen, onOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Only mark dismissed on first close (not when reopened via forceOpen)
    if (!forceOpen) {
      markDismissed()
    }
    onClose?.()
  }, [markDismissed, forceOpen, onClose])

  const handleCopyCode = useCallback(async () => {
    if (!discountCode) return
    try {
      await navigator.clipboard.writeText(discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = discountCode
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [discountCode])

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
        // Modal stays open so user can see and copy their code
        // User must explicitly close via X button or "Start Shopping"
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
                      Free Shipping on $50+
                    </Dialog.Title>

                    <Dialog.Description className="text-ui-fg-subtle text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
                      New to Table Clay? Get{" "}
                      <span className="font-semibold text-ui-fg-base">
                        free shipping on orders $50+
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
                        <p className="text-2xl font-bold tracking-widest text-ui-fg-base mb-4">
                          {discountCode}
                        </p>
                        <button
                          onClick={handleCopyCode}
                          className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            copied
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-brand-600 hover:bg-brand-700 text-white"
                          }`}
                        >
                          {copied ? (
                            <>
                              <CheckCircleSolid className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Copy Code
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <p className="text-sm text-ui-fg-muted">
                      Use this code at checkout for free shipping on orders $50 or more!
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
