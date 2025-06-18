import { useEffect } from 'react'
import { useUserEditing } from '@/stores'

export const usePopStateListener = () => {
  const { setIsPopstateInProgress } = useUserEditing()

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
