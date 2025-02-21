import {
  replaceHiddenNodeIds,
  updateActiveTableName,
  updateIsPopstateInProgress,
  updateShowMode,
} from '@/stores'
import {
  getActiveTableNameFromUrl,
  getHiddenNodeIdsFromUrl,
  getShowModeFromUrl,
} from '@/utils'
import { useEffect } from 'react'

export const usePopStateListener = () => {
  useEffect(() => {
    const handlePopState = async () => {
      const tableName = getActiveTableNameFromUrl()
      const showMode = getShowModeFromUrl()
      const hiddenNodeIds = await getHiddenNodeIdsFromUrl()

      updateIsPopstateInProgress(true)

      await new Promise<void>((resolve) => {
        updateActiveTableName(tableName ?? undefined)
        updateShowMode(showMode)
        setTimeout(resolve, 1)
      })

      await new Promise<void>((resolve) => {
        replaceHiddenNodeIds(hiddenNodeIds)
        setTimeout(resolve, 1)
      })

      updateIsPopstateInProgress(false)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
}
