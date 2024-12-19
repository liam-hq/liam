import type { QueryParam } from '@/schemas/queryParam'
import { updateActiveTableName } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import { useEffect } from 'react'
import { useERDContentContext } from './ERDContentContext'
import { useAutoLayout } from './useAutoLayout'

const getActiveTableNameFromUrl = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search)
  const activeQueryParam: QueryParam = 'active'
  const tableName = urlParams.get(activeQueryParam)

  return tableName || undefined
}

export const useInitialAutoLayout = () => {
  const { getNodes } = useReactFlow()
  const nodes = getNodes()

  const {
    state: { initializeComplete },
  } = useERDContentContext()
  const { handleLayout } = useAutoLayout()

  useEffect(() => {
    if (initializeComplete) {
      return
    }

    const tableNodesInitialized = nodes
      .filter((node) => node.type === 'table')
      .some((node) => node.measured)

    const tableNameFromUrl = getActiveTableNameFromUrl()
    updateActiveTableName(tableNameFromUrl)
    const fitViewOptions = tableNameFromUrl
      ? { maxZoom: 1, duration: 300, nodes: [{ id: tableNameFromUrl }] }
      : undefined

    if (tableNodesInitialized) {
      handleLayout(fitViewOptions)
    }
  }, [initializeComplete, handleLayout, nodes])
}
