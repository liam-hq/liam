'use client'

import { X } from '@liam-hq/ui'
import Image from 'next/image'
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
      <Image src={src} alt={alt} className={styles.image} width={200} height={200} />
      <button
        type="button"
        className={styles.removeButton}
        onClick={onRemove}
        aria-label="Remove attachment"
      >
        <X className={styles.removeIcon} />
      </button>
    </div>
  )
}
