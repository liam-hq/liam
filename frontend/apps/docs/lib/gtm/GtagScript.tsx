import Script from 'next/script'
import { type FC, useId } from 'react'

export const GtagScript: FC = () => {
  const scriptId = useId()
  return (
    <Script
      id={scriptId}
      strategy="afterInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: GTM script injection
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}`,
      }}
    />
  )
}
