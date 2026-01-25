import { getBaseURL } from "@lib/util/env"
import GtmScript from "@lib/analytics/gtm"
import OmnisendScript from "@lib/analytics/omnisend"
import TikTokScript from "@lib/analytics/tiktok"
import { Metadata } from "next"
import { Cormorant_Garamond, Outfit } from "next/font/google"
import "styles/globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Table Clay | Handcrafted Ceramics",
    template: "%s | Table Clay",
  },
  description: "Made by hand, made with care. Discover our collection of handcrafted ceramic mugs, bowls, vases, and more.",
  keywords: ["handmade ceramics", "pottery", "ceramic mugs", "handcrafted", "artisan pottery"],
  openGraph: {
    title: "Table Clay | Handcrafted Ceramics",
    description: "Made by hand, made with care. Discover our collection of handcrafted ceramics.",
    type: "website",
    images: [
      {
        url: "/images/hero/banner.png",
        width: 3616,
        height: 1184,
        alt: "Table Clay hero banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Table Clay | Handcrafted Ceramics",
    description: "Made by hand, made with care. Discover our collection of handcrafted ceramics.",
    images: ["/images/hero/banner.png"],
  },
  verification: {
    google: "STFGWtUhNXIwZx4i8nE-pU66JQFqud4kwez1ymtPb8Y",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${outfit.variable} ${cormorant.variable}`}
    >
      <body className="font-sans antialiased">
        <GtmScript />
        <OmnisendScript />
        <TikTokScript />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
