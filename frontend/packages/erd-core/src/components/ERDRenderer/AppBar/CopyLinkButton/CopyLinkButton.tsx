import {
  Button,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  useToast,
} from '@liam-hq/ui'
import { type FC, useCallback } from 'react'

export const CopyLinkButton: FC = () => {
  const toast = useToast()
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
  }, [toast])

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button variant="solid-primary" size="md" onClick={handleCopyUrl}>
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