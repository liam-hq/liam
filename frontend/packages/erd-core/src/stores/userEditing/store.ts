import type { QueryParam } from '@/schemas/queryParam'
import { proxy, subscribe } from 'valtio'

type UserEditingStore = {
  active: {
    tableName: string | undefined
  }
}

export const userEditingStore = proxy<UserEditingStore>({
  active: {
    tableName: undefined,
  },
})

subscribe(userEditingStore.active, () => {
  const newTableName = userEditingStore.active.tableName
  const url = new URL(window.location.href)
  const activeQueryParam: QueryParam = 'active'

  if (newTableName) {
    url.searchParams.set(activeQueryParam, newTableName)
  } else {
    url.searchParams.delete(activeQueryParam)
  }

  window.history.pushState({}, '', url)
})
