import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import type { FC, MouseEvent, ReactNode } from 'react'
import styles from './ContextMenu.module.css'

type ContextMenuProps = {
  TriggerElement: ReactNode
  ContextMenuElement: ReactNode
  onClick: (event: MouseEvent<HTMLDivElement>) => void
}

export const ContextMenu: FC<ContextMenuProps> = ({
  TriggerElement,
  ContextMenuElement,
  onClick,
}) => {
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger className={styles.contextMenuTrigger}>
        {TriggerElement}
      </ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className={styles.contextMenuContent}>
          <ContextMenuPrimitive.Item
            onClick={onClick}
            className={styles.contextMenuItem}
          >
            {ContextMenuElement}
          </ContextMenuPrimitive.Item>
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  )
}
