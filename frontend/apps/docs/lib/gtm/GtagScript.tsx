import Script from 'next/script'
import type { FC } from 'react'

export const GtagScript: FC = () => {
  return (
    <Script
      id="gtag"
      strategy="afterInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for GTM initialization script
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}`,
      }}
    />
  )
}
