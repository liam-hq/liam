import { userEditingStore } from '@/stores/userEditing/store'
import { IconButton, MessageCircle } from '@liam-hq/ui'
import { ToolbarToggleGroup, ToolbarToggleItem } from '@radix-ui/react-toolbar'
import { type FC, useCallback } from 'react'
import { useSnapshot } from 'valtio'
import styles from './CommentButton.module.css'

const VALUE = 'comment'

export const CommentButton: FC = () => {
  const { isCommentMode } = useSnapshot(userEditingStore)

  const handleChangeValue = useCallback((value: string) => {
    userEditingStore.isCommentMode = value === VALUE
  }, [])

  return (
    <ToolbarToggleGroup
      type="single"
      value={isCommentMode ? VALUE : ''}
      onValueChange={handleChangeValue}
    >
      <ToolbarToggleItem asChild value={VALUE} className={styles.menuButton}>
        <IconButton
          icon={<MessageCircle />}
          size="md"
          tooltipContent="Comment"
        />
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
  )
}
