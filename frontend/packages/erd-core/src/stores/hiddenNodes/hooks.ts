import { useSnapshot } from 'valtio'
import { hiddenNodesStore } from './store'

export const useHiddenNodesStore = () => {
  const { nodes } = useSnapshot(hiddenNodesStore)
  return nodes
}
