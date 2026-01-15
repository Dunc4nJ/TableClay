Google + TikTok Tracking (GTM) - Key Setup Watchouts
Fast approach: install Google Tag Manager (GTM) once on the Medusa storefront (frontend), then add GA4
and TikTok Pixel inside GTM. Keep tag changes out of code and avoid duplicated scripts.
What Nick needs to create or hand over
● GTM container ID (GTM-XXXXXXX) and access to the GTM account (Admin or Publish).
● GA4 Measurement ID (G-XXXXXXXXXX) for the website data stream.
●
If running Google Ads: the Purchase conversion action (conversion ID + label) or a clear list of actions to
track.
● TikTok Pixel ID and access to TikTok Events Manager for verification/testing.
● Which domains are prod vs staging (so tags do not pollute real data).
Storefront installation watchouts (Medusa/Next.js)
●
Install GTM on the storefront only (not Medusa admin/backend) and only once (root layout / _app).
● Avoid duplicates: do not also hardcode GA4 (gtag.js) or TikTok scripts if GTM manages them.
●
If you have staging: use a separate GTM container or add a trigger filter like hostname contains
yourdomain.com.
● Single-page app behavior: ensure page_view fires on route changes (History Change trigger), not only first
load.
Ecommerce event watchouts (what matters for performance)
● Minimum events: ViewContent (product), AddToCart, InitiateCheckout, Purchase.
● Purchase should include value, currency, and order_id (value in dollars - do not send cents).
● Prevent double counting: do not fire Purchase again on refresh/back button - fire once per order.
●
If checkout/thank-you is on a different domain, confirm GTM is present there too and set up GA4
cross-domain linking if needed.
Quick QA checklist (5 minutes)
● GTM Preview: confirm which tags fire on product, cart, checkout, and thank-you pages.
● GA4 Realtime: confirm page_view and key events appear.
● TikTok Test Events: confirm page_view and purchase come through.
● Publish GTM only after QA (name the version, ex: "Prod launch - GA4 + TikTok").
Official setup pages (send these to the web dev)
1) Create GTM account + container support.google.com/tagmanager/answer/14842164
2) Install GTM web container snippet support.google.com/tagmanager/answer/14847097
3) Add GA4 (Google tag) in GTM support.google.com/tagmanager/answer/9442095
4) Add TikTok Pixel via GTM ads.tiktok.com/help/article/get-started-google-tag-manager