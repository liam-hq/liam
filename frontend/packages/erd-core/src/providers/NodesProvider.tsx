import type { Edge, Node } from '@xyflow/react'
import {
  type Dispatch,
  type FC,
  type PropsWithChildren,
  createContext,
  useContext,
  useReducer,
} from 'react'
import { match } from 'ts-pattern'

type NodesAction =
  | {
      type: 'UPDATE_NODES'
      payload: Node[]
    }
  | {
      type: 'UPDATE_HIDDEN'
      payload: Node[]
    }
  | {
      type: 'UPDATE_SIZE_AND_POSITION'
      payload: Node[]
    }
  | {
      type: 'UPDATE_DATA'
      payload: Node[]
    }

const nodesReducer = (state: Node[], action: NodesAction): Node[] => {
  console.log('nodesReducer')
  console.log(action)
  const result = match(action)
    .with({ type: 'UPDATE_NODES' }, (action) => action.payload)
    .with({ type: 'UPDATE_HIDDEN' }, (action) => {
      return state.map((node) => {
        const update = action.payload.find((update) => update.id === node.id)
        if (!update) return node

        return {
          ...node,
          hidden: update.hidden ?? false,
        }
      })
    })
    .with({ type: 'UPDATE_SIZE_AND_POSITION' }, (action) => {
      return state.map((node) => {
        const update = action.payload.find((update) => update.id === node.id)
        if (!update) return node

        return {
          ...node,
          position: update.position,
          width: update.width ?? 0,
          height: update.height ?? 0,
        }
      })
    })
    .with({ type: 'UPDATE_DATA' }, (action) => {
      return state.map((node) => {
        const update = action.payload.find((update) => update.id === node.id)
        if (!update) return node

        return {
          ...node,
          data: {
            ...node.data,
            ...update.data,
          },
        }
      })
    })
    .otherwise(() => state)

  console.log('result')
  console.log(result)
  return result
}

type EdgesAction = {
  type: 'UPDATE_EDGES'
  payload: Edge[]
}

const edgesReducer = (state: Edge[], action: EdgesAction): Edge[] => {
  return match(action)
    .with({ type: 'UPDATE_EDGES' }, (action) => action.payload)
    .otherwise(() => state)
}

const NodesContext = createContext<{
  nodes: Node[]
  edges: Edge[]
  setNodes: Dispatch<NodesAction>
  setEdges: Dispatch<EdgesAction>
} | null>(null)

type Props = {
  nodes: Node[]
  edges: Edge[]
}

export const NodesProvider: FC<PropsWithChildren<Props>> = ({
  nodes: _nodes,
  edges: _edges,
  children,
}) => {
  const [nodes, setNodes] = useReducer(nodesReducer, _nodes)
  const [edges, setEdges] = useReducer(edgesReducer, _edges)

  return (
    <NodesContext.Provider value={{ nodes, edges, setNodes, setEdges }}>
      {children}
    </NodesContext.Provider>
  )
}

export const useNodesContext = () => {
  const context = useContext(NodesContext)
  if (!context) {
    throw new Error('useNodesContext must be used within a NodesProvider')
  }
  return context
}
