import { IconButton } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import type { ComponentProps, FC, MouseEventHandler, ReactNode } from 'react'
import styles from './ToolbarIconButton.module.css'

type ToolbarIconButtonProps = {
  children?: ReactNode
  size?: ComponentProps<typeof IconButton>['size']
  tooltipContent: string
  label: string
  icon: ReactNode
  onClick?: MouseEventHandler
}

export const ToolbarIconButton: FC<ToolbarIconButtonProps> = ({
  children = '',
  size = 'md',
  tooltipContent,
  label,
  icon,
  onClick,
}) => {
  return (
    <ToolbarButton
      asChild
      className={
        children === '' ? styles.menuButton : styles.menuButtonWithText
      }
    >
      <IconButton
        icon={icon}
        tooltipContent={tooltipContent}
        onClick={onClick}
        size={size}
        aria-label={label}
        data-testid={`toolbar-icon-button-${label}`}
      >
        {children}
      </IconButton>
    </ToolbarButton>
  )
}
