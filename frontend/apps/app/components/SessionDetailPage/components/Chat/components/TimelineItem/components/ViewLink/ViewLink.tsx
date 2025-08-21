'use client'

import { ArrowRight, Button } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ViewLink.module.css'

type ViewLinkProps = {
  /**
   * The text to display in the link
   */
  text: string
  /**
   * Callback function when the link is clicked
   */
  onClick?: (() => void) | undefined
  /**
   * Accessible label for screen readers - required for proper accessibility
   */
  ariaLabel: string
}

/**
 * A link component for navigating to different views or sections
 */
export const ViewLink: FC<ViewLinkProps> = ({ text, onClick, ariaLabel }) => {
  return (
    <div className={styles.viewLinkContainer}>
      <Button
        variant="outline-secondary"
        size="xs"
        rightIcon={<ArrowRight size={14} />}
        onClick={onClick}
        disabled={!onClick}
        aria-label={ariaLabel}
      >
        {text}
      </Button>
    </div>
  )
}
