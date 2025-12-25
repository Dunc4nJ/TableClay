"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface NavDropdownItem {
  label: string
  href: string
}

interface NavDropdownProps {
  label: string
  items: NavDropdownItem[]
}

const NavDropdown = ({ label, items }: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="text-stone-600 hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors flex items-center gap-1"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full left-0 mt-0 pt-2 transition-all duration-200 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-lg shadow-lg border border-cream-300 py-2 min-w-[200px]">
          {items.map((item) => (
            <LocalizedClientLink
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-stone-600 hover:bg-cream-100 hover:text-brand-600 text-sm transition-colors"
            >
              {item.label}
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NavDropdown
