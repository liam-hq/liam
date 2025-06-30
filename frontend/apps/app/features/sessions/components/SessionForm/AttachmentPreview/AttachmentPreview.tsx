'use client'

import { RemoveButton } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './AttachmentPreview.module.css'

type Props = {
  src: string
  alt: string
  onRemove: () => void
}

export const AttachmentPreview: FC<Props> = ({ src, alt, onRemove }) => {
  return (
    <div className={styles.container}>
      <img src={src} alt={alt} className={styles.image} />
      <RemoveButton
        onClick={onRemove}
        variant="solid"
        size="sm"
        className={styles.removeButton}
        aria-label="Remove attachment"
      />
    </div>
  )
}
