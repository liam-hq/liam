import type { Table } from '@liam-hq/schema'
import { type FC, useCallback, useEffect, useRef } from 'react'
import { useVersionOrThrow } from '../../../../../../../providers'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../stores'
import { openRelatedTablesLogEvent } from '../../../../../../gtm/utils'
import { useCustomReactflow } from '../../../../../../reactflow/hooks'
import { computeAutoLayout, convertSchemaToNodes } from '../../../../../utils'
import { updateNodesHiddenState } from '../../../utils'
import { Columns } from './Columns'
import { Comment } from './Comment'
import { Constraints } from './Constraints'
import { extractSchemaForTable } from './extractSchemaForTable'
import { Head } from './Head'
import { Indexes } from './Indexes'
import { RelatedTables } from './RelatedTables'
import styles from './TableDetail.module.css'

type Props = {
  table: Table
}

export const TableDetail: FC<Props> = ({ table }) => {
  const ref = useRef<HTMLElement>(null)
  const { setActiveTableName, setHiddenNodeIds } = useUserEditingOrThrow()

  const { current } = useSchemaOrThrow()

  const extractedSchema = extractSchemaForTable(table, current)
  const { nodes, edges } = convertSchemaToNodes({
    schema: extractedSchema,
    showMode: 'TABLE_NAME',
  })

  const { getNodes, getEdges, setNodes, setEdges, fitView } =
    useCustomReactflow()
  const { version } = useVersionOrThrow()

  const handleOpenMainPane = useCallback(async () => {
    const visibleNodeIds: string[] = nodes.map((node) => node.id)
    const mainPaneNodes = getNodes()
    const hiddenNodeIds = mainPaneNodes
      .filter((node) => !visibleNodeIds.includes(node.id))
      .map((node) => node.id)
    const updatedNodes = updateNodesHiddenState({
      nodes: mainPaneNodes,
      hiddenNodeIds,
      shouldHideGroupNodeId: true,
    })

    setHiddenNodeIds(hiddenNodeIds)
    setActiveTableName(null)

    const { nodes: layoutedNodes, edges: layoutedEdges } =
      await computeAutoLayout(updatedNodes, getEdges())
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
    fitView()

    openRelatedTablesLogEvent({
      tableId: table.name,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
  }, [
    nodes,
    table,
    version,
    setActiveTableName,
    setHiddenNodeIds,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
    fitView,
  ])

  // scroll to the element when the TableDetail component is rendered if element id is provided as location.hash
  useEffect(() => {
    if (!location.hash) return
    // location.hash starts with '#'; decode to match actual DOM id
    const elementId = decodeURIComponent(location.hash.slice(1))
    const element = document.getElementById(elementId)

    // the element should be contained within the TableDetail component
    if (!element || !ref.current?.contains(element)) return

    element.scrollIntoView({ block: 'start' })
  }, [])
  return (
    <section className={styles.wrapper} ref={ref}>
      <Head table={table} />
      <div className={styles.body}>
        {table.comment && <Comment table={table} />}
        <Columns table={table} />
        <Indexes tableId={table.name} indexes={table.indexes} />
        <Constraints table={table} />
        <div className={styles.relatedTables}>
          <RelatedTables
            nodes={nodes}
            edges={edges}
            onOpenMainPane={handleOpenMainPane}
          />
        </div>
      </div>
    </section>
  )
}
