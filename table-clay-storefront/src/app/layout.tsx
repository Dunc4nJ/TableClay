import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { DM_Serif_Display, Inter } from "next/font/google"
import "styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
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
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="font-sans antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
