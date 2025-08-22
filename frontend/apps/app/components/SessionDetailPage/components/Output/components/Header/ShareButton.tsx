'use client'

import { Button, Link } from '@liam-hq/ui'
import type { FC } from 'react'
import { useState } from 'react'
import { ShareDialog } from '@/components/ShareDialog'
import styles from './ShareButton.module.css'

type Props = {
  designSessionId: string
  initialIsPublic: boolean
}

export const ShareButton: FC<Props> = ({
  designSessionId,
  initialIsPublic = false,
}) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline-secondary"
        size="md"
        leftIcon={<Link size={16} />}
        onClick={() => setIsShareDialogOpen(true)}
        className={styles.button}
      >
        Share
      </Button>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        designSessionId={designSessionId}
        initialIsPublic={initialIsPublic}
      />
    </>
  )
}
