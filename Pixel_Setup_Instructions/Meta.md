Meta Pixel (FB/IG) - Storefront Setup Watchouts
Use this as a one-page checklist for installing Meta Pixel on a Medusa storefront (usually Next.js). This is
the stuff that causes missing or duplicated events even when Events Manager setup looks correct.
Top watchouts (read this before coding)
• Install on the storefront only: pixels belong on the customer-facing frontend, not the Medusa backend.
• Load once, globally: add the base pixel code a single time at the root layout so it runs on every page.
• No duplicates: do not deploy the pixel in code AND via GTM. Pick one method per pixel.
• SPA routing: on Next.js-style single-page navigation, trigger PageView on route changes (not just initial
load).
• Purchase refresh-safe: fire Purchase only on the thank-you page and guard against refresh/back button
double firing (store a flag keyed to order ID).
• Value/currency correctness: send value and currency every time; confirm cents vs dollars.
• Event Setup Tool vs code: if you create events with the Event Setup Tool, avoid tracking the same events
in code (duplicate counts).
• Staging/dev hygiene: keep staging from sending production events (disable or use a separate Pixel).
QA before spending (10 minutes that saves hours)
• Meta Pixel Helper: confirm events fire and review warnings.
• Events Manager > Test Events: verify PageView, ViewContent, AddToCart, InitiateCheckout, Purchase in
real time.
• Test like a real buyer: ad blocker off, mobile Safari if iOS-heavy, and run through a full checkout once.
Optional (recommended later): Conversions API (server-side)
If you want more reliable Purchase tracking (ad blockers / iOS privacy), add Conversions API. If you send the
same conversion via browser + server, use a shared event_id so Meta can deduplicate.
Domain verification
Verify your domain in Meta (one-time DNS or HTML file step). This helps keep your pixel/events tied to the
business portfolio settings.
Links (4)
Set up and install the Meta Pixel (Business Help Center): https://www.facebook.com/business/help/952192354843755
Meta Pixel Helper (Chrome Web Store):
https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc
Deduplicate Pixel + Conversions API events (Meta Developers):
https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/
Verify your domain (Meta Business Help Center): https://www.facebook.com/business/help/321167023127050