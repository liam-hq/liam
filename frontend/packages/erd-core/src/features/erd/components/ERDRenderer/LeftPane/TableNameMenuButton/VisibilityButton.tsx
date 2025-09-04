import { Eye, EyeClosed, SidebarMenuAction } from '@liam-hq/ui'
import { type FC, type MouseEvent, useCallback } from 'react'
import { useVersionOrThrow } from '../../../../../../providers'
import { useUserEditingOrThrow } from '../../../../../../stores'
import { toggleLogEvent } from '../../../../../gtm/utils'
import { useCustomReactflow } from '../../../../../reactflow/hooks'
import styles from './VisibilityButton.module.css'

type Props = {
  tableName: string
  hidden?: boolean | undefined
}

export const VisibilityButton: FC<Props> = ({ tableName, hidden }) => {
  const { toggleHiddenNodeId } = useUserEditingOrThrow()
  const { updateNode } = useCustomReactflow()
  const { version } = useVersionOrThrow()

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      toggleHiddenNodeId(tableName)
      updateNode(tableName, { hidden: !hidden })

      toggleLogEvent({
        element: 'tableNameMenuButton',
        isShow: !!hidden,
        tableId: tableName,
        platform: version.displayedOn,
        gitHash: version.gitHash,
        ver: version.version,
        appEnv: version.envName,
      })
    },
    [tableName, hidden, updateNode, toggleHiddenNodeId, version],
  )

  return (
    <SidebarMenuAction
      showOnHover
      onClick={handleClick}
      aria-label={hidden ? 'Show Table' : 'Hide Table'}
    >
      {hidden ? (
        <EyeClosed className={styles.icon} />
      ) : (
        <Eye className={styles.icon} />
      )}
    </SidebarMenuAction>
  )
}
