'use client'

import {
  Check,
  Copy,
  Link,
  Lock,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@liam-hq/ui'
import { type FC, useState } from 'react'
import { usePublicShareServerAction } from '@/hooks/usePublicShareServerAction'
import { urlgen } from '@/libs/routes'
import styles from './ShareDialog.module.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  designSessionId: string
  initialIsPublic: boolean
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

    const publicUrl = `${window.location.origin}${urlgen('public/design_sessions/[id]', { id: designSessionId })}`
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ModalRoot open={isOpen} onOpenChange={onClose}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className={styles.dialog}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <ModalTitle className={styles.dialogTitle}>Share</ModalTitle>
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
                <h4
                  id="visibility-section-title"
                  className={styles.sectionTitle}
                >
                  Visibility
                </h4>
                <div className={styles.visibilityControls}>
                  <div className={styles.selectWrapper}>
                    <Select
                      value={isPublic ? 'link' : 'private'}
                      onValueChange={handleVisibilityChange}
                      disabled={loading}
                    >
                      <SelectTrigger
                        className={styles.visibilitySelect}
                        aria-labelledby="visibility-section-title"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">
                          <span className={styles.selectItemContent}>
                            <Lock size={16} />
                            Private
                          </span>
                        </SelectItem>
                        <SelectItem value="link">
                          <span className={styles.selectItemContent}>
                            <Link size={16} />
                            Anyone with the link
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
