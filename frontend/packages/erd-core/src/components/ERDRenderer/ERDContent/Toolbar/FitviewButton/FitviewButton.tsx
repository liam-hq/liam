import { clickLogEvent } from '@/features/gtm/utils'
import { useUserEditingStore } from '@/stores'
import { IconButton, Scan } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useReactFlow } from '@xyflow/react'
import { type FC, useCallback } from 'react'

export const FitviewButton: FC = () => {
  const { fitView } = useReactFlow()
  const { showMode } = useUserEditingStore()

  const handleClick = useCallback(() => {
    clickLogEvent({
      element: 'fitview',
      showMode: showMode,
    })
    fitView()
  }, [fitView, showMode])

  return (
    <ToolbarButton asChild onClick={handleClick}>
      <IconButton icon={<Scan />} tooltipContent="Zoom to Fit" />
    </ToolbarButton>
  )
}
