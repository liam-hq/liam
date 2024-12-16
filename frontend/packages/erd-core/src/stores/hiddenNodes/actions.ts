import { hiddenNodesStore } from './store'

export const addHiddenNode = (nodeId: string) => {
  if (!hiddenNodesStore.nodes.includes(nodeId)) {
    hiddenNodesStore.nodes.push(nodeId)
  }
}

export const removeHiddenNode = (nodeId: string) => {
  const index = hiddenNodesStore.nodes.indexOf(nodeId)
  if (index !== -1) {
    hiddenNodesStore.nodes.splice(index, 1)
  }
}
