import { toggleLogEvent } from '@/features/gtm/utils'
import { useCliVersion } from '@/providers'
import { toggleHiddenNodeId } from '@/stores'
import { Eye, EyeClosed, SidebarMenuAction } from '@liam-hq/ui'
import { type FC, type MouseEvent, useCallback } from 'react'
import styles from './VisibilityButton.module.css'

type Props = {
  tableName: string
  hidden?: boolean | undefined
}

export const VisibilityButton: FC<Props> = ({ tableName, hidden }) => {
  const { cliVersion } = useCliVersion()
  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      toggleHiddenNodeId(tableName)
      toggleLogEvent({
        element: 'tableNameMenuButton',
        isShow: !!hidden,
        tableId: tableName,
        cliVer: cliVersion.version,
        appEnv: cliVersion.envName,
      })
    },
    [tableName, hidden, cliVersion.version, cliVersion.envName],
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
