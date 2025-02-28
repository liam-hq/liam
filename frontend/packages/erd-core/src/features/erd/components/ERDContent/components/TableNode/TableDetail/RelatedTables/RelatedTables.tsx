import { GotoIcon, IconButton, Waypoints as WaypointsIcon } from '@liam-hq/ui'
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react'
import { type FC, type MouseEvent, useCallback } from 'react'
import { ERDContent } from '../../../../ERDContent'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './RelatedTables.module.css'

type Props = {
  nodes: Node[]
  edges: Edge[]
  onOpenMainPane: () => void
}

export const RelatedTables: FC<Props> = ({ nodes, edges, onOpenMainPane }) => {
  const handleClick = useCallback(
    async (event: MouseEvent) => {
      event.stopPropagation()
      onOpenMainPane()
    },
    [onOpenMainPane],
  )

  return (
    <CollapsibleHeader
      title="Related tables"
      icon={<WaypointsIcon width={12} />}
      isContentVisible={true}
      // NOTE: Header height for Columns/Indices/Unique sections:
      // (40px (content) + 1px (borders)) * 3 = 123px
      stickyTopHeight={123}
      // NOTE: 360px is the height of the content
      contentMaxHeight={360}
      additionalButtons={
        <IconButton
          icon={<GotoIcon />}
          tooltipContent="Open in main area"
          onClick={handleClick}
        />
      }
    >
      <div className={styles.outerWrapper}>
        <div className={styles.contentWrapper}>
          <ReactFlowProvider>
            <ERDContent
              nodes={nodes}
              edges={edges}
              displayArea="relatedTables"
            />
          </ReactFlowProvider>
        </div>
      </div>
    </CollapsibleHeader>
  )
}
