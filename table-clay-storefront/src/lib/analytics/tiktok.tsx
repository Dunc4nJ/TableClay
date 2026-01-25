"use client"

import Script from "next/script"

const getPixelCode = () => process.env.NEXT_PUBLIC_TIKTOK_PIXEL_CODE?.trim()

declare global {
  interface Window {
    ttq?: {
      track: (
        event: string,
        data?: Record<string, unknown>,
        options?: { event_id?: string }
      ) => void
      page: () => void
      load: (pixelCode: string) => void
      _i?: Record<string, unknown[]>
      _t?: Record<string, number>
      _o?: Record<string, Record<string, unknown>>
      methods?: string[]
      setAndDefer?: (target: object, method: string) => void
      instance?: (pixelCode: string) => unknown[]
    }
    TiktokAnalyticsObject?: string
  }
}

export const trackTikTokEvent = (
  eventName: string,
  data?: Record<string, unknown>,
  options?: { event_id?: string }
) => {
  if (typeof window === "undefined" || !window.ttq) {
    return
  }

  window.ttq.track(eventName, data, options)
}

export default function TikTokScript() {
  const pixelCode = getPixelCode()

  if (!pixelCode) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "TikTok pixel disabled: NEXT_PUBLIC_TIKTOK_PIXEL_CODE is not set."
      )
    }
    return null
  }

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
  ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
  var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
  var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixelCode}');
  ttq.page();
}(window, document, 'ttq');`}
    </Script>
  )
}
