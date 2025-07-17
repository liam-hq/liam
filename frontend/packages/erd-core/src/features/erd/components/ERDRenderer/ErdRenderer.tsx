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
import {
  type ComponentProps,
  createRef,
  type FC,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { AppBar } from './AppBar'
import styles from './ERDRenderer.module.css'
import '@/styles/globals.css'
import { toggleLogEvent } from '@/features/gtm/utils'
import { useIsTouchDevice } from '@/hooks'
import { useVersionOrThrow } from '@/providers'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import {
  convertSchemaToNodes,
  createHash,
  setCookie,
  setCookieJson,
} from '../../utils'
import { ERDContent } from '../ERDContent'
import { CardinalityMarkers } from './CardinalityMarkers'
import { CommandPalette, CommandPaletteProvider } from './CommandPalette'
import { ErrorDisplay } from './ErrorDisplay'
import { LeftPane } from './LeftPane'
import { RelationshipEdgeParticleMarker } from './RelationshipEdgeParticleMarker'
import { TableDetailDrawer, TableDetailDrawerRoot } from './TableDetailDrawer'
import { Toolbar } from './Toolbar'

type Props = {
  defaultSidebarOpen?: boolean | undefined
  errorObjects?: ComponentProps<typeof ErrorDisplay>['errors']
  defaultPanelSizes?: number[]
  withAppBar?: boolean
}

const SIDEBAR_COOKIE_NAME = 'sidebar:state'
const PANEL_LAYOUT_COOKIE_NAME = 'panels:layout'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export const ERDRenderer: FC<Props> = ({
  defaultSidebarOpen = false,
  errorObjects = [],
  defaultPanelSizes = [20, 80],
  withAppBar = false,
}) => {
  const [open, setOpen] = useState(defaultSidebarOpen)
  const [isResizing, setIsResizing] = useState(false)

  const { showMode, showDiff } = useUserEditingOrThrow()

  const { current, merged } = useSchemaOrThrow()

  const schema = useMemo(() => {
    return showDiff && merged ? merged : current
  }, [showDiff, merged, current])

  const schemaKey = useMemo(() => {
    const str = JSON.stringify(schema)
    return createHash(str)
  }, [schema])

  const { nodes, edges } = convertSchemaToNodes({
    schema,
    showMode,
  })

  const leftPanelRef = createRef<ImperativePanelHandle>()

  const { version } = useVersionOrThrow()
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

      setCookie(SIDEBAR_COOKIE_NAME, nextPanelState.toString(), {
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      })
    },
    [version, leftPanelRef],
  )

  const setWidth = useCallback((sizes: number[]) => {
    setCookieJson(PANEL_LAYOUT_COOKIE_NAME, sizes, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
  }, [])

  const isMobile = useIsTouchDevice()

  return (
    <SidebarProvider
      className={styles.wrapper}
      open={open}
      onOpenChange={handleChangeOpen}
    >
      <CardinalityMarkers />
      <RelationshipEdgeParticleMarker />
      <ToastProvider>
        <CommandPaletteProvider>
          {withAppBar && <AppBar />}
          <ReactFlowProvider>
            <ResizablePanelGroup
              direction="horizontal"
              className={styles.mainWrapper}
              onLayout={setWidth}
            >
              <ResizablePanel
                collapsible
                defaultSize={open ? defaultPanelSizes[0] : 0}
                minSize={isMobile ? 40 : 15}
                maxSize={isMobile ? 80 : 30}
                ref={leftPanelRef}
                isResizing={isResizing}
                onResize={(size: number) => {
                  if (open && size < 15) {
                    handleChangeOpen(false)
                  }
                }}
              >
                <LeftPane />
              </ResizablePanel>
              <ResizableHandle onDragging={(e) => setIsResizing(e)} />
              <ResizablePanel
                collapsible
                defaultSize={defaultPanelSizes[1]}
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
                          key={`${schemaKey}-${showMode}`}
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
            <CommandPalette />
          </ReactFlowProvider>
        </CommandPaletteProvider>
      </ToastProvider>
    </SidebarProvider>
  )
}
