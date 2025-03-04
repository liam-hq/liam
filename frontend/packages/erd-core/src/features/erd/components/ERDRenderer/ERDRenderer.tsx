import '@xyflow/react/dist/style.css'
import {
  type ImperativePanelHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SidebarProvider,
  SidebarTrigger,
  ToastProvider,
} from '@liam-hq/ui'
import { ReactFlowProvider } from '@xyflow/react'
import { type FC, createRef, useCallback, useState } from 'react'
import { AppBar } from './AppBar'
import styles from './ERDRenderer.module.css'
import '@/styles/globals.css'
import { toggleLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useDBStructureStore, useUserEditingStore } from '@/stores'
import { convertDBStructureToNodes } from '../../utils'
import { ERDContent } from '../ERDContent'
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
  defaultSidebarWidth?: number
}

const SIDEBAR_WIDTH_COOKIE_NAME = 'sidebar:width'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export const ERDRenderer: FC<Props> = ({
  defaultSidebarOpen = false,
  errorObjects = [],
  defaultSidebarWidth = 20,
}) => {
  const [open, setOpen] = useState(defaultSidebarOpen)

  const { showMode } = useUserEditingStore()
  const dbStructure = useDBStructureStore()
  const { nodes, edges } = convertDBStructureToNodes({
    dbStructure,
    showMode,
  })

  const leftPanelRef = createRef<ImperativePanelHandle>()

  const { version } = useVersion()
  const handleChangeOpen = useCallback(
    (nextPanelState: boolean) => {
      setOpen(nextPanelState)
      toggleLogEvent({
        element: 'leftPane',
        isShow: nextPanelState,
        platform: version.displayedOn,
        gitHash: version.gitHash,
        ver: version.version,
        appEnv: version.envName,
      })

      nextPanelState === false
        ? leftPanelRef.current?.collapse()
        : leftPanelRef.current?.expand()
    },
    [version, leftPanelRef],
  )

  // This sets the cookie to keep the sidebar state.
  const setWidth = useCallback(() => {
    document.cookie = `${SIDEBAR_WIDTH_COOKIE_NAME}=${leftPanelRef.current?.getSize()}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  }, [leftPanelRef])

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
          <ResizablePanelGroup
            direction="horizontal"
            className={styles.mainWrapper}
            onLayout={setWidth}
          >
            <ResizablePanel
              collapsible
              defaultSize={open ? defaultSidebarWidth : 0}
              minSize={10}
              maxSize={30}
              ref={leftPanelRef}
            >
              <LeftPane />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel collapsible>
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </ReactFlowProvider>
      </ToastProvider>
    </SidebarProvider>
  )
}
