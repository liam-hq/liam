import {
  Button,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import { useCopy } from '@liam-hq/ui/hooks'
import { type FC, useCallback } from 'react'
import { useVersionOrThrow } from '../../../../../../providers'
import { clickLogEvent } from '../../../../../gtm/utils'

export const CopyLinkButton: FC = () => {
  const { version } = useVersionOrThrow()
  const { copy } = useCopy({
    toast: {
      success: 'Link copied!',
      error: 'URL copy failed',
    },
  })

  const handleCopyUrl = useCallback(() => {
    copy(window.location.href)

    clickLogEvent({
      element: 'copyLinkButton',
      platform: version.displayedOn,
      ver: version.version,
      gitHash: version.gitHash,
      appEnv: version.envName,
    })
  }, [copy, version])

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button
            data-testid="copy-link"
            variant="solid-primary"
            size="md"
            onClick={handleCopyUrl}
          >
            Copy Link
          </Button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent sideOffset={4}>Copy current URL</TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}
