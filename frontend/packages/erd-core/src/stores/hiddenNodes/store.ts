import { proxy } from 'valtio'

type HiddenNodesStore = {
  nodes: string[]
}

export const hiddenNodesStore = proxy<HiddenNodesStore>({
  nodes: [],
})
