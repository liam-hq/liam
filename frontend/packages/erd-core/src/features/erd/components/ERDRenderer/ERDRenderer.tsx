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
  defaultLeftPanelWidth?: number
  defaultRightPanelWidth?: number
}

const SIDEBAR_COOKIE_NAME = 'sidebar:state'
const LEFT_PANEL_WIDTH_COOKIE_NAME = 'left-panel:width'
const RIGHT_PANEL_WIDTH_COOKIE_NAME = 'right-panel:width'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export const ERDRenderer: FC<Props> = ({
  defaultSidebarOpen = false,
  errorObjects = [],
  defaultLeftPanelWidth = 20,
  defaultRightPanelWidth = 80,
}) => {
  const [open, setOpen] = useState(defaultSidebarOpen)
  const [isResizing, setIsResizing] = useState(false)

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

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${nextPanelState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [version, leftPanelRef],
  )

  // This sets the cookie to keep the panel widths
  const setWidth = useCallback((sizes: number[]) => {
    const [leftWidth, rightWidth] = sizes
    document.cookie = `${LEFT_PANEL_WIDTH_COOKIE_NAME}=${leftWidth}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    document.cookie = `${RIGHT_PANEL_WIDTH_COOKIE_NAME}=${rightWidth}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  }, [])

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
              defaultSize={open ? defaultLeftPanelWidth : 0}
              minSize={10}
              maxSize={30}
              ref={leftPanelRef}
              isResizing={isResizing}
            >
              <LeftPane />
            </ResizablePanel>
            <ResizableHandle onDragging={(e) => setIsResizing(e)} />
            <ResizablePanel
              collapsible
              defaultSize={defaultRightPanelWidth}
              isResizing={isResizing}
            >
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
