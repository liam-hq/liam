'use client'

import { CornerDownLeft, IconButton } from '@liam-hq/ui'
import type { FC, MouseEvent } from 'react'
import styles from './SendButton.module.css'

type SendButtonProps = {
  hasContent: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  disabled: boolean
}

export const SendButton: FC<SendButtonProps> = ({
  hasContent,
  onClick,
  disabled = false,
}) => {
  return (
    <IconButton
      type="submit"
      disabled={!hasContent || disabled}
      size="sm"
      icon={<CornerDownLeft />}
      tooltipContent="Send"
      className={styles.sendButton}
      onClick={onClick}
    />
  )
}
