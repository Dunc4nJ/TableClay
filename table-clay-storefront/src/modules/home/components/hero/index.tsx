import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="relative w-full h-[85vh] min-h-[600px]">
      {/* Background Image */}
      <Image
        src="/images/hero/banner.png"
        alt="Table Clay handcrafted pottery collection"
        fill
        className="object-cover object-center"
        priority
        quality={90}
      />

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end items-center text-center pb-20 px-6">
        <div className="max-w-2xl">
          {/* Tagline */}
          <h1 className="font-display text-4xl small:text-5xl medium:text-6xl text-white mb-4 drop-shadow-lg">
            Made by Hand, Made with Care
          </h1>

          {/* Subtitle */}
          <p className="text-lg small:text-xl text-white/90 mb-8 font-light drop-shadow-md">
            Discover our collection of handcrafted ceramic mugs, bowls, and more.
            Each piece tells a story.
          </p>

          {/* CTA Button */}
          <LocalizedClientLink
            href="/store"
            className="inline-block bg-black hover:bg-stone-800 text-white px-8 py-4 rounded-none uppercase text-sm tracking-wider font-medium transition-all duration-300"
          >
            Shop Now
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default Hero
