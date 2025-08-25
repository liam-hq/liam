import { useEffect } from 'react'
import { useFitScreen } from '../useFitScreen'

export const useSubscribeTidyUpCommand = () => {
  const { tidyUp } = useFitScreen()

  // Tidy up ERD when ⇧T is pressed
  useEffect(() => {
    const down = async (event: KeyboardEvent) => {
      if (event.code === 'KeyT' && event.shiftKey) {
        tidyUp()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [tidyUp])
}
