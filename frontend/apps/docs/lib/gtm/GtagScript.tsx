import Script from 'next/script'
import type { FC } from 'react'

export const GtagScript: FC = () => {
  return (
    <>
      {/* biome-ignore lint/nursery/useUniqueElementIds: TODO: Review and use dynamic ID generation with useId() hook */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Required for GTM initialization script */}
      <Script
        id="gtag"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}`,
        }}
      />
    </>
  )
}
