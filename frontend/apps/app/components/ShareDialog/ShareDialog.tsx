'use client'

import { Check, Copy, Link, Lock } from '@liam-hq/ui'
import { type FC, useState } from 'react'
import { usePublicShareServerAction } from '@/hooks/usePublicShareServerAction'
import styles from './ShareDialog.module.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  designSessionId: string
  initialIsPublic?: boolean
}

export const ShareDialog: FC<Props> = ({
  isOpen,
  onClose,
  designSessionId,
  initialIsPublic = false,
}) => {
  const { isPublic, loading, togglePublicShare } = usePublicShareServerAction({
    designSessionId,
    initialIsPublic,
  })
  const [copied, setCopied] = useState(false)

  const handleVisibilityChange = async (value: string) => {
    const shouldBePublic = value === 'link'
    if (shouldBePublic !== isPublic) {
      const result = await togglePublicShare()
      if (!result.success) {
        console.error(result.error)
      }
    }
  }

  const copyLink = async () => {
    if (!isPublic) return

    const publicUrl = `${window.location.origin}/public/sessions/${designSessionId}`
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      <div className={styles.dialog}>
        <div className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <h2 className={styles.dialogTitle}>Share</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className={styles.shareContent}>
            {/* People with access */}
            <div className={styles.accessSection}>
              <h4 className={styles.sectionTitle}>People with access</h4>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  <span>You</span>
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>You (Owner)</div>
                  <div className={styles.userEmail}>Has full access</div>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className={styles.visibilitySection}>
              <h4 className={styles.sectionTitle}>Visibility</h4>
              <div className={styles.visibilityControls}>
                <div className={styles.selectWrapper}>
                  <select
                    value={isPublic ? 'link' : 'private'}
                    onChange={(e) => handleVisibilityChange(e.target.value)}
                    disabled={loading}
                    className={styles.visibilitySelect}
                  >
                    <option value="private" className={styles.selectOption}>
                      🔒 Private
                    </option>
                    <option value="link" className={styles.selectOption}>
                      🔗 Anyone with the link
                    </option>
                  </select>
                  <div className={styles.selectIcon}>
                    {isPublic ? <Link size={16} /> : <Lock size={16} />}
                  </div>
                </div>

                {isPublic && (
                  <button
                    type="button"
                    onClick={copyLink}
                    disabled={loading}
                    className={styles.copyButton}
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Link
                      </>
                    )}
                  </button>
                )}
              </div>
              {isPublic && (
                <p className={styles.visibilityDescription}>
                  Anyone with the link can view this session
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
