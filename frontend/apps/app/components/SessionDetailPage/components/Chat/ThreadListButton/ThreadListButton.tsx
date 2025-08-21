'use client'

import { IconButton, List } from '@liam-hq/ui'
import type { ComponentProps, FC } from 'react'

type Props = Omit<
  ComponentProps<typeof IconButton>,
  'icon' | 'tooltipContent'
> & {
  tooltipContent?: string
  variant?: ComponentProps<typeof IconButton>['variant']
}

export const ThreadListButton: FC<Props> = ({
  tooltipContent = 'Thread List',
  className,
  variant = 'hoverBackground',
  ...props
}) => {
  return (
    <IconButton
      icon={<List />}
      tooltipContent={tooltipContent}
      variant={variant}
      {...props}
    />
  )
}
