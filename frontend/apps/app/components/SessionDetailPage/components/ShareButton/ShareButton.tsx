'use client'

import { IconButton, Share2 } from '@liam-hq/ui'
import type { FC } from 'react'
import { useState } from 'react'
import { usePublicShare } from './hooks/usePublicShare'
import styles from './ShareButton.module.css'

type Props = {
  designSessionId: string
}

export const ShareButton: FC<Props> = ({ designSessionId }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isPublic, isLoading, togglePublicShare } =
    usePublicShare(designSessionId)

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleTogglePublicShare = async () => {
    await togglePublicShare()
    setIsMenuOpen(false)
  }

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/public/sessions/${designSessionId}`
    navigator.clipboard.writeText(publicUrl)
    setIsMenuOpen(false)
  }

  return (
    <div className={styles.container}>
      <IconButton
        icon={<Share2 />}
        tooltipContent="Share"
        onClick={handleToggleMenu}
        size="sm"
      />

      {isMenuOpen && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setIsMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsMenuOpen(false)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
          <div className={styles.menu}>
            <div className={styles.menuItem}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleTogglePublicShare}
                  disabled={isLoading}
                  className={styles.checkbox}
                />
                <span>Public access</span>
              </label>
              <p className={styles.description}>
                Anyone with the link can view this session
              </p>
            </div>

            {isPublic && (
              <button
                type="button"
                onClick={handleCopyLink}
                className={styles.copyButton}
              >
                Copy public link
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
