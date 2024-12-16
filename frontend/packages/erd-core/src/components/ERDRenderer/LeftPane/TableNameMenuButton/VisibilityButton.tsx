import { addHiddenNode, removeHiddenNode } from '@/stores/hiddenNodes'
import { Eye, EyeClosed, SidebarMenuAction } from '@liam-hq/ui'
import { useReactFlow } from '@xyflow/react'
import { type FC, type MouseEvent, useCallback } from 'react'
import styles from './VisibilityButton.module.css'

type Props = {
  tableName: string
  hidden?: boolean | undefined
}

export const VisibilityButton: FC<Props> = ({ tableName, hidden }) => {
  const { updateNode } = useReactFlow()

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      !hidden ? addHiddenNode(tableName) : removeHiddenNode(tableName)
      updateNode(tableName, (node) => ({ ...node, hidden: !node.hidden }))
    },
    [updateNode, tableName, hidden],
  )

  return (
    <SidebarMenuAction showOnHover onClick={handleClick}>
      {hidden ? (
        <EyeClosed className={styles.icon} />
      ) : (
        <Eye className={styles.icon} />
      )}
    </SidebarMenuAction>
  )
}
