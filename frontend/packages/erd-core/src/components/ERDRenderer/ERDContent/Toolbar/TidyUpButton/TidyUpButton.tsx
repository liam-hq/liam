import { clickLogEvent } from '@/features/gtm/utils'
import { useUserEditingStore } from '@/stores'
import { IconButton, TidyUpIcon } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { type FC, useCallback } from 'react'
import { useAutoLayout } from '../../useAutoLayout'

export const TidyUpButton: FC = () => {
  const { handleLayout } = useAutoLayout()
  const { showMode } = useUserEditingStore()
  const handleClick = useCallback(() => {
    clickLogEvent({
      element: 'tidyUp',
      showMode: showMode,
    })
    handleLayout()
  }, [handleLayout, showMode])

  return (
    <ToolbarButton asChild>
      <IconButton
        icon={<TidyUpIcon />}
        tooltipContent="Tidy up"
        onClick={handleClick}
      />
    </ToolbarButton>
  )
}
