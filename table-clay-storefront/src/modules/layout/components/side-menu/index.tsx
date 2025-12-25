"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"

// Main menu items
const MainMenuItems = {
  Home: "/",
  "Shop All": "/store",
}

// Collections menu items
const CollectionItems = {
  "Cloud Line": "/collections/cloud-line",
  "Modern Line": "/collections/modern-line",
  "Japanese Line": "/collections/japanese-line",
  "Love Line": "/collections/love-line",
  "Nature Line": "/collections/nature-line",
  "Odd & Ends": "/collections/no-line",
}

// Category menu items
const CategoryItems = {
  Mugs: "/categories/mugs",
  Vases: "/categories/vases",
  Bowls: "/categories/bowls",
  "Odd & Ends": "/categories/odd-and-ends",
}

// Account menu items
const AccountMenuItems = {
  Account: "/account",
  Cart: "/cart",
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-ui-fg-base"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-[51] inset-x-0 text-sm text-ui-fg-on-color m-2 backdrop-blur-2xl overflow-y-auto">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-[rgba(3,7,18,0.5)] rounded-rounded justify-between p-6"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button data-testid="close-menu-button" onClick={close}>
                        <XMark />
                      </button>
                    </div>

                    <div className="flex flex-col gap-8 flex-1">
                      {/* Main Navigation */}
                      <ul className="flex flex-col gap-4 items-start justify-start">
                        {Object.entries(MainMenuItems).map(([name, href]) => (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="text-2xl leading-8 hover:text-ui-fg-disabled"
                              onClick={close}
                              data-testid={`${name.toLowerCase().replace(" ", "-")}-link`}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>

                      {/* Collections Section */}
                      <div>
                        <Text className="text-ui-fg-muted text-xs uppercase tracking-wider mb-3">
                          Collections
                        </Text>
                        <ul className="flex flex-col gap-3 items-start justify-start">
                          {Object.entries(CollectionItems).map(([name, href]) => (
                            <li key={name}>
                              <LocalizedClientLink
                                href={href}
                                className="text-lg leading-6 hover:text-ui-fg-disabled"
                                onClick={close}
                              >
                                {name}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Categories Section */}
                      <div>
                        <Text className="text-ui-fg-muted text-xs uppercase tracking-wider mb-3">
                          Categories
                        </Text>
                        <ul className="flex flex-col gap-3 items-start justify-start">
                          {Object.entries(CategoryItems).map(([name, href]) => (
                            <li key={name}>
                              <LocalizedClientLink
                                href={href}
                                className="text-lg leading-6 hover:text-ui-fg-disabled"
                                onClick={close}
                              >
                                {name}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Account Section */}
                      <ul className="flex flex-col gap-4 items-start justify-start">
                        {Object.entries(AccountMenuItems).map(([name, href]) => (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="text-2xl leading-8 hover:text-ui-fg-disabled"
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-y-6 mt-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
                        © {new Date().getFullYear()} Table Clay. All rights
                        reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
