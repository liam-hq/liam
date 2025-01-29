import { toggleLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { toggleHiddenNodeId } from '@/stores'
import { Eye, EyeClosed, SidebarMenuAction } from '@liam-hq/ui'
import { type FC, type MouseEvent, useCallback } from 'react'
import styles from './VisibilityButton.module.css'

type Props = {
  tableName: string
  hidden?: boolean | undefined
}

export const VisibilityButton: FC<Props> = ({ tableName, hidden }) => {
  const { version } = useVersion()
  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      toggleHiddenNodeId(tableName)
      version.displayedOn === 'cli' &&
        toggleLogEvent({
          element: 'tableNameMenuButton',
          isShow: !!hidden,
          tableId: tableName,
          cliVer: version.version,
          appEnv: version.envName,
        })
    },
    [tableName, hidden, version],
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
