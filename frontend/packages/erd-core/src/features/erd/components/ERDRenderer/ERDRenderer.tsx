import '@xyflow/react/dist/style.css'
import { SidebarProvider, SidebarTrigger, ToastProvider } from '@liam-hq/ui'
import { ReactFlowProvider } from '@xyflow/react'
import { type FC, useCallback, useState } from 'react'
import styles from './ERDRenderer.module.css'
import '@/styles/globals.css'
import { toggleLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useDBStructureStore, useUserEditingStore } from '@/stores'
import { convertDBStructureToNodes } from '../../utils'
import { ERDContent } from '../ERDContent'
import { AppBar } from './AppBar'
import { CardinalityMarkers } from './CardinalityMarkers'
import { ErrorDisplay } from './ErrorDisplay'
import { LeftPane } from './LeftPane'
import { RelationshipEdgeParticleMarker } from './RelationshipEdgeParticleMarker'
import { TableDetailDrawer, TableDetailDrawerRoot } from './TableDetailDrawer'
import { Toolbar } from './Toolbar'

type ErrorObject = {
  name: string
  message: string
}

type Props = {
  defaultSidebarOpen?: boolean | undefined
  errorObjects?: ErrorObject[] | undefined
}

export const ERDRenderer: FC<Props> = ({
  defaultSidebarOpen = false,
  errorObjects = [],
}) => {
  const [open, setOpen] = useState(defaultSidebarOpen)

  const { showMode } = useUserEditingStore()
  const dbStructure = useDBStructureStore()
  const { nodes, edges } = convertDBStructureToNodes({
    dbStructure,
    showMode,
  })

  const { version } = useVersion()
  const handleChangeOpen = useCallback(
    (open: boolean) => {
      setOpen(open)
      toggleLogEvent({
        element: 'leftPane',
        isShow: open,
        platform: version.displayedOn,
        gitHash: version.gitHash,
        ver: version.version,
        appEnv: version.envName,
      })
    },
    [version],
  )

  return (
    <SidebarProvider
      className={styles.wrapper}
      open={open}
      onOpenChange={handleChangeOpen}
    >
      <CardinalityMarkers />
      <RelationshipEdgeParticleMarker />
      <ToastProvider>
        <AppBar />
        <ReactFlowProvider>
          <div className={styles.mainWrapper}>
            <LeftPane />
            <main className={styles.main}>
              <div className={styles.triggerWrapper}>
                <SidebarTrigger />
              </div>
              <TableDetailDrawerRoot>
                {errorObjects.length > 0 && (
                  <ErrorDisplay errors={errorObjects} />
                )}
                {errorObjects.length > 0 || (
                  <>
                    <ERDContent
                      key={`${nodes.length}-${showMode}`}
                      nodes={nodes}
                      edges={edges}
                      displayArea="main"
                    />
                    <TableDetailDrawer />
                  </>
                )}
              </TableDetailDrawerRoot>
              {errorObjects.length === 0 && (
                <div className={styles.toolbarWrapper}>
                  <Toolbar />
                </div>
              )}
            </main>
          </div>
        </ReactFlowProvider>
      </ToastProvider>
    </SidebarProvider>
  )
}
