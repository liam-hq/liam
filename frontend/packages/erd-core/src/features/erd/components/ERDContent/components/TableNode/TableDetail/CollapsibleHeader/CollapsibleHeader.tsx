import { ChevronDown, ChevronUp, IconButton } from '@liam-hq/ui'
import type React from 'react'
import { type MouseEvent, useState } from 'react'
import styles from './CollapsibleHeader.module.css'

type CollapsibleHeaderProps = {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isContentVisible: boolean
  stickyTopHeight: number
  contentMaxHeight: number
  additionalButtons?: React.ReactNode
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  title,
  icon,
  children,
  isContentVisible,
  stickyTopHeight,
  contentMaxHeight,
  additionalButtons,
}) => {
  const [isClosed, setIsClosed] = useState(!isContentVisible)

  const handleClose = (
    event: MouseEvent | React.KeyboardEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation()
    setIsClosed(!isClosed)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsClosed(!isClosed)
    }
  }

  return (
    <>
      <div
        className={styles.header}
        style={{ top: stickyTopHeight }}
        // biome-ignore lint/a11y/useSemanticElements: Implemented with div button to be button in button
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.iconTitleContainer}>
          {icon}
          <h2 className={styles.heading}>{title}</h2>
        </div>
        <div className={styles.iconContainer}>
          {additionalButtons}
          <IconButton
            icon={isClosed ? <ChevronDown /> : <ChevronUp />}
            tooltipContent={isClosed ? 'Open' : 'Close'}
            onClick={handleClose}
          />
        </div>
      </div>
      <div
        className={styles.content}
        style={{ maxHeight: isClosed ? '0' : `${contentMaxHeight}px` }}
      >
        {children}
      </div>
    </>
  )
}
