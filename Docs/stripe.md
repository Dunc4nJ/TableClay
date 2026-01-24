# Stripe Integration (Storefront)

This storefront uses Stripe PaymentIntents with Stripe Elements for card entry and
Express Checkout for wallets (Link/Apple Pay/Google Pay). A payment session is created
client-side to obtain a `client_secret`, then the card is confirmed before calling
`placeOrder`.

Recent fixes (Jan 24, 2026):
- Kept the Stripe `<Elements>` provider mounted throughout checkout to avoid
  missing context errors.
- Confirmed payment client-side in the checkout footer before placing the order.
- Moved payment session creation to client-side logic (no server render mutations)
  and ensured a session exists for Express Checkout.

Operational notes:
- Webhook endpoint should only receive actionable events (exclude
  `payment_intent.created`), otherwise Medusa may attempt to authorize too early.
- Express checkout requires a valid `client_secret` to render wallet buttons.
