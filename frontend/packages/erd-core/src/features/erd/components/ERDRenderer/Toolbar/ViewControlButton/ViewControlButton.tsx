import { IconButton, Waypoints } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import type { FC } from 'react'

export const ViewControlButton: FC = () => {
  return (
    // TODO: Implement a button click logic
    <ToolbarButton asChild>
      <IconButton icon={<Waypoints />} tooltipContent="View Control" />
    </ToolbarButton>
  )
}
