import '@xyflow/react/dist/style.css'
import {
  SidebarProvider,
  SidebarTrigger,
  ToastProvider,
  getSidebarStateFromCookie,
} from '@liam-hq/ui'
import { ReactFlowProvider } from '@xyflow/react'
import type { FC } from 'react'
import { AppBar } from './AppBar'
import { ERDContent } from './ERDContent'
import styles from './ERDRenderer.module.css'
import { LeftPane } from './LeftPane'
import '@/styles/globals.css'
import { useDBStructureStore, useUserEditingStore } from '@/stores'
import { Loading } from './ERDContent/Loading'
// biome-ignore lint/nursery/useImportRestrictions: Fixed in the next PR.
import { Toolbar } from './ERDContent/Toolbar'
import { TableDetailDrawer, TableDetailDrawerRoot } from './TableDetailDrawer'
import { convertDBStructureToNodes } from './convertDBStructureToNodes'

export const ERDRenderer: FC = () => {
  const defaultOpen = getSidebarStateFromCookie()
  const { showMode } = useUserEditingStore()
  const dbStructure = useDBStructureStore()
  const { nodes, edges } = convertDBStructureToNodes({
    dbStructure,
    showMode,
  })
  const loading = <Loading className={styles.loading} />

  return (
    <div className={styles.wrapper}>
      <ToastProvider>
        <AppBar />
        <SidebarProvider defaultOpen={defaultOpen}>
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
                  >
                    {loading}
                  </ERDContent>
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
