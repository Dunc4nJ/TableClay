import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function PotteryWheelHero() {
  return (
    <section className="relative w-full">
      <LocalizedClientLink
        href="/products/mini-wheel"
        className="group relative block w-full aspect-[29/16] overflow-hidden"
      >
        <Image
          src="/images/hero/pottery-wheel.png"
          alt="Table Clay Mini Pottery Wheel Starter Kit - A mother and child enjoying pottery together"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_center] transition-transform duration-500 group-hover:scale-[1.02]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 lg:bottom-16 lg:right-24">
          <span className="inline-block rounded-full bg-[#B86F52] px-8 py-4 text-lg font-medium text-white shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:bg-[#A65D42] group-hover:shadow-xl md:text-xl">
            Start Creating
          </span>
        </div>
      </LocalizedClientLink>
    </section>
  )
}
