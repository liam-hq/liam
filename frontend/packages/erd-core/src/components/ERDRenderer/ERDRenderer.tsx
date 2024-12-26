import '@xyflow/react/dist/style.css'
import { SidebarProvider, SidebarTrigger, ToastProvider } from '@liam-hq/ui'
import { ReactFlowProvider } from '@xyflow/react'
import { type FC, useCallback, useState } from 'react'
import { AppBar } from './AppBar'
import { ERDContent } from './ERDContent'
import styles from './ERDRenderer.module.css'
import { LeftPane } from './LeftPane'
import '@/styles/globals.css'
import { toggleLogEvent } from '@/features/gtm/utils'
import { useCliVersion } from '@/providers'
import { useDBStructureStore, useUserEditingStore } from '@/stores'
// biome-ignore lint/nursery/useImportRestrictions: Fixed in the next PR.
import { Toolbar } from './ERDContent/Toolbar'
import { TableDetailDrawer, TableDetailDrawerRoot } from './TableDetailDrawer'
import { convertDBStructureToNodes } from './convertDBStructureToNodes'

type Props = {
  defaultSidebarOpen?: boolean | undefined
}

export const ERDRenderer: FC<Props> = ({ defaultSidebarOpen = false }) => {
  const [open, setOpen] = useState(defaultSidebarOpen)

  const { showMode } = useUserEditingStore()
  const dbStructure = useDBStructureStore()
  const { nodes, edges } = convertDBStructureToNodes({
    dbStructure,
    showMode,
  })

  const { cliVersion } = useCliVersion()
  const handleChangeOpen = useCallback(
    (open: boolean) => {
      setOpen(open)
      toggleLogEvent({
        element: 'leftPane',
        isShow: open,
        cliVer: cliVersion.version,
        appEnv: cliVersion.envName,
      })
    },
    [cliVersion.version, cliVersion.envName],
  )

  return (
    <div className={styles.wrapper}>
      <ToastProvider>
        <AppBar />
        <SidebarProvider open={open} onOpenChange={handleChangeOpen}>
          <ReactFlowProvider>
            <div className={styles.mainWrapper}>
              <LeftPane />
              <main className={styles.main}>
                <div className={styles.triggerWrapper}>
                  <SidebarTrigger />
                </div>
                <TableDetailDrawerRoot>
                  <ERDContent
                    key={`${nodes.length}-${showMode}`}
                    nodes={nodes}
                    edges={edges}
                  />
                  <div className={styles.toolbarWrapper}>
                    <Toolbar />
                  </div>
                  <TableDetailDrawer />
                </TableDetailDrawerRoot>
              </main>
            </div>
          </ReactFlowProvider>
        </SidebarProvider>
      </ToastProvider>
    </div>
  )
}
