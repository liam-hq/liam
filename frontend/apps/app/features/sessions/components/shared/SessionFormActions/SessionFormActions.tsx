'use client'

import type { FC } from 'react'
import { ActionButton } from '../ActionButton'
import { AttachButton } from '../AttachButton'
import { DeepModelingToggle } from '../DeepModelingToggle'
import { MicButton } from '../MicButton'
import styles from './SessionFormActions.module.css'

type Props = {
  isPending: boolean
  hasContent: boolean
  // eslint-disable-next-line no-restricted-syntax
  onMicClick?: () => void
  // eslint-disable-next-line no-restricted-syntax
  onAttachClick?: () => void
  // eslint-disable-next-line no-restricted-syntax
  onFileSelect?: (files: FileList) => void
  // eslint-disable-next-line no-restricted-syntax
  onSubmit?: () => void
  // eslint-disable-next-line no-restricted-syntax
  onCancel?: () => void
}

export const SessionFormActions: FC<Props> = ({
  isPending = false,
  hasContent = false,
  onMicClick,
  onAttachClick,
  onFileSelect,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className={styles.container}>
      <DeepModelingToggle name="isDeepModelingEnabled" disabled={isPending}>
        Deep Modeling
      </DeepModelingToggle>
      {/* Temporarily hidden - Issue #5166: Hide voice input and file attachment UI */}
      <div className={styles.hidden}>
        <MicButton
          onClick={onMicClick || (() => {})}
          disabled={isPending}
          state="default"
        />
      </div>
      <div className={styles.hidden}>
        <AttachButton
          onClick={onAttachClick || (() => {})}
          onFileSelect={onFileSelect}
          disabled={isPending}
        />
      </div>
      <ActionButton
        hasContent={hasContent}
        isPending={isPending}
        onSubmit={onSubmit || (() => {})}
        onCancel={onCancel || (() => window.location.reload())}
      />
    </div>
  )
}

SessionFormActions.displayName = 'SessionFormActions'
