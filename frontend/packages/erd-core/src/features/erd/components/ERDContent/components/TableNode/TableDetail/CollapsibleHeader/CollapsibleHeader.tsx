import { ChevronDown, ChevronUp, IconButton } from '@liam-hq/ui'
import React, {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useState,
} from 'react'
import styles from './CollapsibleHeader.module.css'

type CollapsibleHeaderProps = {
  title: string
  headerId: string
  scrollToHeader: () => void
  icon: ReactNode
  children: ReactNode
  isContentVisible: boolean
  stickyTopHeight: number
  contentMaxHeight: number
  additionalButtons?: ReactNode
}

export const CollapsibleHeader = React.forwardRef<
  HTMLDivElement,
  CollapsibleHeaderProps
>(
  (
    {
      title,
      headerId,
      scrollToHeader,
      icon,
      children,
      isContentVisible,
      stickyTopHeight,
      contentMaxHeight,
      additionalButtons,
    },
    containerRef,
  ) => {
    const [isClosed, setIsClosed] = useState(!isContentVisible)

    const handleClose = (event: MouseEvent | KeyboardEvent<HTMLDivElement>) => {
      event.stopPropagation()
      setIsClosed((isClosed) => !isClosed)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        setIsClosed((isClosed) => !isClosed)
      }
    }

    return (
      <>
        {/* biome-ignore lint/a11y/useSemanticElements: Using div with button role to avoid button-in-button nesting */}
        <div
          className={styles.header}
          style={{ top: stickyTopHeight }}
          role="button"
          tabIndex={0}
          onClick={handleClose}
          onKeyDown={handleKeyDown}
          id={headerId}
        >
          <div className={styles.iconTitleContainer}>
            {icon}
            <h2 className={styles.heading}>
              <a
                href={`#${headerId}`}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey) {
                    return
                  }

                  event.preventDefault()
                  event.stopPropagation()

                  scrollToHeader()
                  setIsClosed(false)
                }}
              >
                {title} #
              </a>
            </h2>
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
          ref={containerRef}
        >
          {children}
        </div>
      </>
    )
  },
)
