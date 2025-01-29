import type { QueryParam } from '@/schemas/queryParam'
import type { ShowMode } from '@/schemas/showMode'
import { compressToEncodedURIComponent } from '@/utils'
import { proxy, subscribe } from 'valtio'
import { proxySet } from 'valtio/utils'

type UserEditingStore = {
  active: {
    tableName: string | undefined
  }
  showMode: ShowMode
  hiddenNodeIds: Set<string>
  isPopstateInProgress: boolean
}

export const userEditingStore = proxy<UserEditingStore>({
  active: {
    tableName: undefined,
  },
  showMode: 'TABLE_NAME',
  hiddenNodeIds: proxySet<string>(),
  isPopstateInProgress: false,
})

subscribe(userEditingStore.active, () => {
  const newTableName = userEditingStore.active.tableName
  const isPopstateInProgress = userEditingStore.isPopstateInProgress
  const url = new URL(window.location.href)
  const activeQueryParam: QueryParam = 'active'

  if (newTableName) {
    url.searchParams.set(activeQueryParam, newTableName)
  } else {
    url.searchParams.delete(activeQueryParam)
  }

  if (!isPopstateInProgress) {
    window.history.pushState({}, '', url)
  }
})

subscribe(userEditingStore.hiddenNodeIds, async () => {
  const url = new URL(window.location.href)
  const activeQueryParam: QueryParam = 'hidden'
  const hiddenNodeIds = Array.from(userEditingStore.hiddenNodeIds).join(',')

  url.searchParams.delete(activeQueryParam)
  if (hiddenNodeIds) {
    const compressed = await compressToEncodedURIComponent(hiddenNodeIds)
    url.searchParams.set(activeQueryParam, compressed)
  }

  window.history.pushState({}, '', url)
})
