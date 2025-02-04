import { clickLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { Copy, SidebarMenuButton, SidebarMenuItem, useToast } from '@liam-hq/ui'
import { type FC, useCallback } from 'react'
import styles from './CopyLinkButton.module.css'

export const CopyLinkButton: FC = () => {
  const toast = useToast()
  const { version } = useVersion()

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        toast({
          title: 'Link copied!',
          status: 'success',
        })
      })
      .catch((err) => {
        console.error(err)
        toast({
          title: 'URL copy failed',
          status: 'error',
        })
      })

    clickLogEvent({
      element: 'copyLinkButton',
      platform: version.displayedOn,
      ver: version.version,
      gitHash: version.gitHash,
      appEnv: version.envName,
    })
  }, [toast, version])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className={styles.button} onClick={handleCopyUrl}>
        <Copy className={styles.icon} />
        <span className={styles.label}>Copy Link</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
