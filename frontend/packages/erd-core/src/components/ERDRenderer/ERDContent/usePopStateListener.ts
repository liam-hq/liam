import { updateActiveTableName, updateIsPopstateInProgress } from '@/stores'
import { useEffect } from 'react'

export const usePopStateListener = () => {
  useEffect(() => {
    const handlePopState = async () => {
      const url = new URL(window.location.href)
      const tableName = url.searchParams.get('active')

      updateIsPopstateInProgress(true)
      updateActiveTableName(tableName ?? undefined)

      setTimeout(() => {
        updateIsPopstateInProgress(false)
      }, 0)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
}
