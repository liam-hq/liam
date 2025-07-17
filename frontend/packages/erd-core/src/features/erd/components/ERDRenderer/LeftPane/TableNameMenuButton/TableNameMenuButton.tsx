import {
  ContextMenu,
  Eye,
  SidebarMenuButton,
  SidebarMenuItem,
  Table2,
} from '@liam-hq/ui'
import clsx from 'clsx'
import {
  type FC,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import type { TableNodeType } from '@/features/erd/types'
import { selectTableLogEvent } from '@/features/gtm/utils'
import { useVersionOrThrow } from '@/providers'
import { useUserEditingOrThrow } from '@/stores'
import styles from './TableNameMenuButton.module.css'
import { VisibilityButton } from './VisibilityButton'

type Props = {
  node: TableNodeType
  nodes: TableNodeType[]
  showSelectedTables: (event: MouseEvent<HTMLDivElement>) => void
}

export const TableNameMenuButton: FC<Props> = ({
  node,
  nodes,
  showSelectedTables,
}) => {
  const nodeId = node.id
  const name = node.data.table.name
  const { selectTable } = useTableSelection()
  const { selectedNodeIds, updateSelectedNodeIds } = useUserEditingOrThrow()
  const { version } = useVersionOrThrow()
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  const checkTruncation = useCallback(() => {
    if (!textRef.current) return
    const element = textRef.current
    setIsTruncated(element.scrollWidth > element.clientWidth)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(checkTruncation, 0)
    const observer = new ResizeObserver(checkTruncation)

    if (textRef.current) {
      observer.observe(textRef.current)
    }

    window.addEventListener('resize', checkTruncation)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkTruncation)
      observer.disconnect()
    }
  }, [checkTruncation])

  const handleTableSelection = useCallback(
    (event: MouseEvent | KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const isMultiSelect =
        event.ctrlKey || event.metaKey
          ? 'ctrl'
          : event.shiftKey
            ? 'shift'
            : 'single'

      updateSelectedNodeIds(nodeId, isMultiSelect, nodes)
      selectTable({
        tableId: name,
        displayArea: 'main',
      })

      selectTableLogEvent({
        ref: 'leftPane',
        tableId: name,
        platform: version.displayedOn,
        gitHash: version.gitHash,
        ver: version.version,
        appEnv: version.envName,
      })
    },
    [nodeId, name, nodes, selectTable, version, updateSelectedNodeIds],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleTableSelection(event)
      }
    },
    [handleTableSelection],
  )

  const handleContextMenuClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation()
      showSelectedTables(event)
    },
    [showSelectedTables],
  )

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={clsx(
          styles.button,
          selectedNodeIds.has(nodeId) && styles.active,
        )}
        asChild
        tooltip={name}
        showtooltip={isTruncated}
      >
        {/* biome-ignore lint/a11y/useSemanticElements: div with button role needed to avoid button-in-button nesting */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTableSelection}
          onKeyDown={handleKeyDown}
          aria-label={`Menu button for ${name}`}
          data-testid={`table-name-menu-button-${nodeId}`}
        >
          <ContextMenu
            TriggerElement={
              <>
                <Table2 size="10px" />
                <span ref={textRef} className={styles.tableName}>
                  {name}
                </span>
                <VisibilityButton tableName={name} hidden={node.hidden} />
              </>
            }
            ContextMenuElement={
              <>
                <Eye className={styles.icon} />
                <span>Show Only Selected Layers</span>
              </>
            }
            onClick={handleContextMenuClick}
          />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
