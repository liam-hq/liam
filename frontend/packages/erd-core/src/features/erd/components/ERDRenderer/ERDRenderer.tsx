import { NuqsAdapter } from 'nuqs/adapters/react'
import '@xyflow/react/dist/style.css'
import type { TableGroup } from '@liam-hq/db-structure'
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
import { useVersion } from '@/providers'
import { SchemaProvider, useSchema } from '@/stores'
import type { SchemaStore } from '@/stores/schema/schema'
import { UserEditingProvider, useUserEditing } from '@/stores/userEditing'
import { convertSchemaToNodes, createHash } from '../../utils'
import { ERDContent } from '../ERDContent'
import { CardinalityMarkers } from './CardinalityMarkers'
import { CommandPalette } from './CommandPalette'
import { ErrorDisplay } from './ErrorDisplay'
import { LeftPane } from './LeftPane'
import { RelationshipEdgeParticleMarker } from './RelationshipEdgeParticleMarker'
import { TableDetailDrawer, TableDetailDrawerRoot } from './TableDetailDrawer'
import { Toolbar } from './Toolbar'

type InnerProps = {
  defaultSidebarOpen?: boolean | undefined
  errorObjects?: ComponentProps<typeof ErrorDisplay>['errors']
  defaultPanelSizes?: number[]
  withAppBar?: boolean
  tableGroups?: Record<string, TableGroup>
  onAddTableGroup?: ((params: TableGroup) => void) | undefined
}

type Props = InnerProps & {
  schema: SchemaStore
}

const SIDEBAR_COOKIE_NAME = 'sidebar:state'
const PANEL_LAYOUT_COOKIE_NAME = 'panels:layout'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export const ERDRenderer: FC<Props> = ({ schema, ...innerProps }) => {
  return (
    <NuqsAdapter>
      <UserEditingProvider>
        <SchemaProvider schema={schema}>
          <ERDRendererInner {...innerProps} />
        </SchemaProvider>
      </UserEditingProvider>
    </NuqsAdapter>
  )
}

const ERDRendererInner: FC<InnerProps> = ({
  defaultSidebarOpen = false,
  errorObjects = [],
  defaultPanelSizes = [20, 80],
  withAppBar = false,
  tableGroups = {},
  onAddTableGroup,
}) => {
  const [open, setOpen] = useState(defaultSidebarOpen)
  const [isResizing, setIsResizing] = useState(false)

  const { showMode } = useUserEditing()
  const { current } = useSchema()
  const schemaKey = useMemo(() => {
    const str = JSON.stringify(current)
    return createHash(str)
  }, [current])

  const { nodes, edges } = convertSchemaToNodes({
    schema: current,
    showMode,
    tableGroups,
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

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${nextPanelState}; path=/; max-age=${COOKIE_MAX_AGE}`
    },
    [version, leftPanelRef],
  )

  const setWidth = useCallback((sizes: number[]) => {
    document.cookie = `${PANEL_LAYOUT_COOKIE_NAME}=${JSON.stringify(sizes)}; path=/; max-age=${COOKIE_MAX_AGE}`
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
                        onAddTableGroup={onAddTableGroup}
                      />
                      <TableDetailDrawer />
                    </>
                  )}
                </TableDetailDrawerRoot>
                {errorObjects.length === 0 && (
                  <div className={styles.toolbarWrapper}>
                    <Toolbar withGroupButton={!!onAddTableGroup} />
                  </div>
                )}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ReactFlowProvider>
        <CommandPalette />
      </ToastProvider>
    </SidebarProvider>
  )
}
