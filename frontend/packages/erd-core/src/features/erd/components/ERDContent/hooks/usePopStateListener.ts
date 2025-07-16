import { useEffect } from 'react'
import { useUserEditingOrThrow } from '@/stores'

export const usePopStateListener = () => {
  const { setIsPopstateInProgress } = useUserEditingOrThrow()

  useEffect(() => {
    const handlePopstate = () => {
      setIsPopstateInProgress(true)
      // Reset the flag in the next tick
      setTimeout(() => setIsPopstateInProgress(false), 0)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [setIsPopstateInProgress])
}
