import Script from 'next/script'
import { useId, type FC } from 'react'

export const GtagScript: FC = () => {
  const gtagId = useId()
  return (
    <Script
      id={gtagId}
      strategy="afterInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: GTM script injection
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}`,
      }}
    />
  )
}
