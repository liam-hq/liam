import Script from 'next/script'
import type { FC } from 'react'

export const GtagScript: FC = () => {
  return (
    // biome-ignore lint/nursery/useUniqueElementIds: GTM script injection requires stable ID
    <Script
      id="gtag"
      strategy="afterInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: GTM script injection
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}`,
      }}
    />
  )
}
