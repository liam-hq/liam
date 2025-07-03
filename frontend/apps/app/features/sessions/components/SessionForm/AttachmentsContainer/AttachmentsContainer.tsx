'use client'

import type { FC } from 'react'
import { AttachmentPreview } from '../AttachmentPreview'
import type { FileAttachment } from '../hooks/useFileAttachments'
import styles from './AttachmentsContainer.module.css'

type Props = {
  attachments: FileAttachment[]
  onRemove: (id: string) => void
}

export const AttachmentsContainer: FC<Props> = ({ attachments, onRemove }) => {
  if (attachments.length === 0) return null

  return (
    <div className={styles.container}>
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.id}
          src={attachment.url}
          alt={attachment.name}
          onRemove={() => onRemove(attachment.id)}
        />
      ))}
    </div>
  )
}
