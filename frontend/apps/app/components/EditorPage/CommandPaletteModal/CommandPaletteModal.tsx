import { ModalContent, ModalPortal, ModalRoot, ModalTitle } from '@/components'
import type { FC } from 'react'
import styles from './CommandPaletteModal.module.css'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShowERDClick: () => void
}

export const CommandPaletteModal: FC<Props> = ({
  open,
  onOpenChange,
  onShowERDClick,
}) => {
  return (
    <ModalRoot open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalContent>
          <ModalTitle>Run Command</ModalTitle>
          <div className={styles.commandList}>
            <button
              type="button"
              className={styles.button}
              onClick={onShowERDClick}
            >
              Show ERD
            </button>
            <button type="button" className={styles.button}>
              Tables: Focus on View
            </button>
            <button type="button" className={styles.button}>
              File Changes: Focus on View
            </button>
            <button type="button" className={styles.button}>
              Chat: Focus on View
            </button>
          </div>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
