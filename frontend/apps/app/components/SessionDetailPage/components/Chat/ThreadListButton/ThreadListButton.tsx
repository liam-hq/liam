'use client'

import { IconButton, List } from '@liam-hq/ui'
import type { ComponentProps, FC } from 'react'

type Props = Omit<
  ComponentProps<typeof IconButton>,
  'icon' | 'tooltipContent'
> & {
  // eslint-disable-next-line no-restricted-syntax
  tooltipContent?: string
  // eslint-disable-next-line no-restricted-syntax
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
