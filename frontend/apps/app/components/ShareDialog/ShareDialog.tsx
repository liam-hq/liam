'use client'

import {
  Building2,
  Check,
  ChevronDown,
  Copy,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  Globe,
  Link,
  Lock,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  Spinner,
  XIcon,
} from '@liam-hq/ui'
import { type FC, useRef, useState } from 'react'
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
  const isTogglingRef = useRef(false)

  const handlePrivateClick = async () => {
    if (isTogglingRef.current || !isPublic) return
    isTogglingRef.current = true
    try {
      const result = await togglePublicShare()
      if (!result.success) console.error(result.error)
    } finally {
      isTogglingRef.current = false
    }
  }

  const handlePublicClick = async () => {
    if (isTogglingRef.current || isPublic) return
    isTogglingRef.current = true
    try {
      const result = await togglePublicShare()
      if (!result.success) console.error(result.error)
    } finally {
      isTogglingRef.current = false
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
                <XIcon size={16} />
              </button>
            </div>

            <div className={styles.shareContent}>
              {/* People with access */}
              <div className={styles.accessSection}>
                <h4 className={styles.sectionTitle}>People with access</h4>
                <div className={styles.userInfo}>
                  <div className={styles.accessIcon}>
                    {isPublic ? <Globe size={20} /> : <Building2 size={20} />}
                  </div>
                  <div className={styles.userDetails}>
                    <div className={styles.userName}>
                      {isPublic ? 'Anyone' : 'Organization members'}
                    </div>
                    <div className={styles.userEmail}>
                      {isPublic
                        ? 'Anyone with the link can view'
                        : 'Members can view this session'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className={styles.visibilitySection}>
                <h4
                  id="visibility-section-title"
                  className={styles.sectionTitle}
                >
                  <span>Visibility</span>
                  {loading && <Spinner size="12" />}
                </h4>
                <div className={styles.visibilityControls}>
                  <div className={styles.selectWrapper}>
                    <DropdownMenuRoot>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={styles.visibilityDropdown}
                          disabled={loading}
                          aria-labelledby="visibility-section-title"
                        >
                          <span className={styles.dropdownValue}>
                            {isPublic ? (
                              <>
                                <Link size={16} />
                                <span>Anyone with the link</span>
                              </>
                            ) : (
                              <>
                                <Lock size={16} />
                                <span>Private</span>
                              </>
                            )}
                          </span>
                          <ChevronDown
                            size={16}
                            className={styles.dropdownIcon}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent
                          className={styles.dropdownContent}
                          align="start"
                          sideOffset={4}
                        >
                          <DropdownMenuItem
                            onSelect={handlePrivateClick}
                            disabled={loading}
                            className={styles.dropdownItem}
                            data-selected={!isPublic}
                          >
                            <Lock size={16} />
                            <span>Private</span>
                            {!isPublic && (
                              <Check size={16} className={styles.checkIcon} />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={handlePublicClick}
                            disabled={loading}
                            className={styles.dropdownItem}
                            data-selected={isPublic}
                          >
                            <Link size={16} />
                            <span>Anyone with the link</span>
                            {isPublic && (
                              <Check size={16} className={styles.checkIcon} />
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenuRoot>
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
                <p className={styles.visibilityDescription}>
                  {isPublic
                    ? 'Anyone with the link can view this session'
                    : 'Only organization members can view this session'}
                </p>
              </div>
            </div>
          </div>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
