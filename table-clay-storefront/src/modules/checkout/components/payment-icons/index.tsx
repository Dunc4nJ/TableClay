"use client"

/**
 * Payment card brand icons for checkout
 * Uses inline SVG for reliability and fast loading
 */

const VisaIcon = () => (
  <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="Visa">
    <rect fill="#fff" x="0" y="0" width="38" height="24" rx="3" />
    <rect fill="#1434CB" x="0.5" y="0.5" width="37" height="23" rx="2.5" stroke="#E5E7EB" strokeWidth="1" />
    <path
      fill="#1434CB"
      d="M15.255 15.94h-2.19l1.369-8.48h2.19l-1.37 8.48zM24.074 7.644c-.435-.173-.871-.26-1.525-.26-1.681 0-2.865.895-2.874 2.177-.017 .942.85 1.47 1.5 1.784.659.32.881.53.881.816-.008.44-.528.64-1.015.64-.677 0-1.04-.1-1.595-.337l-.218-.104-.238 1.466c.394.183 1.125.34 1.883.348 1.785 0 2.943-.882 2.96-2.252.009-.75-.448-1.32-1.43-1.792-.594-.303-.96-.507-.96-.816.009-.278.31-.567.975-.567.553-.017 .96.117 1.268.252l.153.07.235-1.425zM27.22 12.87l.677-1.827c-.009.017.14-.38.227-.63l.117.567s.327 1.585.395 1.89h-1.416zM28.885 7.46h-1.318c-.41 0-.716.117-.896.548l-2.537 6.065h1.793s.294-.812.36-.992h2.19c.05.231.21.992.21.992h1.582l-1.384-6.613zM12.136 7.46L10.46 13.4l-.18-.912c-.31-1.05-1.276-2.19-2.357-2.762l1.524 5.737h1.802l2.685-8.003h-1.799z"
    />
    <path
      fill="#F9A533"
      d="M8.804 7.46H6.008l-.026.147c2.139.547 3.553 1.862 4.138 3.445l-.597-3.044c-.1-.424-.403-.54-.719-.548z"
    />
  </svg>
)

const MastercardIcon = () => (
  <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="Mastercard">
    <rect fill="#fff" x="0" y="0" width="38" height="24" rx="3" />
    <rect fill="#fff" x="0.5" y="0.5" width="37" height="23" rx="2.5" stroke="#E5E7EB" strokeWidth="1" />
    <circle fill="#EB001B" cx="15" cy="12" r="7" />
    <circle fill="#F79E1B" cx="23" cy="12" r="7" />
    <path
      fill="#FF5F00"
      d="M19 6.5c1.8 1.3 3 3.4 3 5.5s-1.2 4.2-3 5.5c-1.8-1.3-3-3.4-3-5.5s1.2-4.2 3-5.5z"
    />
  </svg>
)

const AmexIcon = () => (
  <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="American Express">
    <rect fill="#006FCF" x="0" y="0" width="38" height="24" rx="3" />
    <path
      fill="#fff"
      d="M7.5 12.25h2.2l-1.1-2.75-1.1 2.75zM27.75 14.75h1.1v-4.5h-1.7l-1.35 3-1.35-3h-1.7v4.2l-2.1-4.2h-1.6l-2.25 4.5h1.2l.45-1.1h2.55l.45 1.1h2.35v-3.5l1.5 3.5h1l1.5-3.5v3.5zM13.25 14.75h1.15v-4.5h-1.15v4.5zM5.5 14.75h1.15l2.5-3.3v3.3h1.15v-4.5H9.15l-2.5 3.3v-3.3H5.5v4.5z"
    />
  </svg>
)

const DiscoverIcon = () => (
  <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="Discover">
    <rect fill="#fff" x="0" y="0" width="38" height="24" rx="3" />
    <rect fill="#fff" x="0.5" y="0.5" width="37" height="23" rx="2.5" stroke="#E5E7EB" strokeWidth="1" />
    <path fill="#F26F21" d="M27 0h8c1.66 0 3 1.34 3 3v18c0 1.66-1.34 3-3 3h-8.5L27 0z" />
    <circle fill="#F26F21" cx="22" cy="12" r="5" />
    <text x="5" y="14" fill="#000" fontSize="5" fontWeight="600">DISCOVER</text>
  </svg>
)

const PayPalIcon = () => (
  <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="PayPal">
    <rect fill="#fff" x="0" y="0" width="38" height="24" rx="3" />
    <rect fill="#fff" x="0.5" y="0.5" width="37" height="23" rx="2.5" stroke="#E5E7EB" strokeWidth="1" />
    <path
      fill="#003087"
      d="M23.458 8.543c.168-.995.008-1.672-.546-2.285C22.285 5.545 21.19 5.25 19.743 5.25H14.13a.724.724 0 00-.715.612l-2.32 14.71a.435.435 0 00.43.503h3.126l.785-4.976-.024.157a.723.723 0 01.714-.612h1.488c2.916 0 5.199-1.185 5.866-4.61.02-.101.038-.2.053-.296l.022-.121-.098-.074z"
    />
    <path
      fill="#009CDE"
      d="M23.458 8.543a5.437 5.437 0 01-.098.491c-.667 3.425-2.95 4.61-5.866 4.61h-1.488a.723.723 0 00-.714.612l-.96 6.082a.38.38 0 00.375.437h2.631a.633.633 0 00.625-.535l.026-.133.498-3.153.032-.174a.633.633 0 01.625-.535h.394c2.548 0 4.543-1.036 5.126-4.032.243-1.252.117-2.298-.527-3.034a2.515 2.515 0 00-.68-.536z"
    />
  </svg>
)

interface PaymentIconsProps {
  showAll?: boolean
  className?: string
}

const PaymentIcons: React.FC<PaymentIconsProps> = ({
  showAll = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <VisaIcon />
      <MastercardIcon />
      <AmexIcon />
      {showAll && (
        <>
          <DiscoverIcon />
          <span className="text-xs text-gray-400 ml-1">+2</span>
        </>
      )}
    </div>
  )
}

export { PaymentIcons, VisaIcon, MastercardIcon, AmexIcon, DiscoverIcon, PayPalIcon }
export default PaymentIcons
