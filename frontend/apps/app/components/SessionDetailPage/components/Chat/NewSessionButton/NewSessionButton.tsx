'use client'

import { IconButton, Plus } from '@liam-hq/ui'
import type { ComponentProps, FC } from 'react'

type Props = Omit<
  ComponentProps<typeof IconButton>,
  'icon' | 'tooltipContent'
> & {
  tooltipContent?: string
  variant?: ComponentProps<typeof IconButton>['variant']
}

export const NewSessionButton: FC<Props> = ({
  tooltipContent = 'New Session',
  className,
  variant = 'hoverBackground',
  ...props
}) => {
  return (
    <IconButton
      icon={<Plus />}
      tooltipContent={tooltipContent}
      variant={variant}
      {...props}
    />
  )
}
