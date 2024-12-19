import type { ShowMode } from '@/schemas'
import { useReactFlow } from '@xyflow/react'
import {
  type FC,
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'
import { match } from 'ts-pattern'
import { columnHandleId } from '../columnHandleId'
import { isRelationshipEdge } from './RelationshipEdge'

type ERDContentContextState = {
  loading: boolean
  showMode: ShowMode
  initializeComplete: boolean
}

type ERDContentContextActions = {
  setLoading: (loading: boolean) => void
  setShowMode: (showMode: ShowMode) => void
  setInitializeComplete: (initializeComplete: boolean) => void
}

type ERDContentConextValue = {
  state: ERDContentContextState
  actions: ERDContentContextActions
}

const ERDContentContext = createContext<ERDContentConextValue>({
  state: {
    loading: true,
    showMode: 'TABLE_NAME',
    initializeComplete: false,
  },
  actions: {
    setLoading: () => {},
    setShowMode: () => {},
    setInitializeComplete: () => {},
  },
})

export const useERDContentContext = () => useContext(ERDContentContext)

export const ERDContentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [showMode, setShowMode] = useState<ShowMode>('TABLE_NAME')
  const [initializeComplete, setInitializeComplete] = useState(false)
  const { getEdges, setEdges } = useReactFlow()

  const handleChangeShowMode = useCallback(
    (value: ShowMode) => {
      setShowMode(value)
      setLoading(true)
      const edges = getEdges()
      const updatedEdges = match(value)
        .with('TABLE_NAME', () => {
          return edges.map((edge) => ({
            ...edge,
            sourceHandle: null,
            targetHandle: null,
          }))
        })
        .with('ALL_FIELDS', 'KEY_ONLY', () => {
          return edges.map((edge) => {
            if (
              !isRelationshipEdge(edge) ||
              edge.data?.relationship === undefined
            ) {
              return edge
            }

            const {
              primaryTableName,
              primaryColumnName,
              foreignTableName,
              foreignColumnName,
            } = edge.data.relationship

            return {
              ...edge,
              sourceHandle: columnHandleId(primaryTableName, primaryColumnName),
              targetHandle: columnHandleId(foreignTableName, foreignColumnName),
            }
          })
        })
        .exhaustive()

      setEdges(updatedEdges)
      setLoading(false)
    },
    [getEdges, setEdges],
  )

  return (
    <ERDContentContext.Provider
      value={{
        state: { loading, initializeComplete, showMode },
        actions: {
          setLoading,
          setShowMode: handleChangeShowMode,
          setInitializeComplete,
        },
      }}
    >
      {children}
    </ERDContentContext.Provider>
  )
}
