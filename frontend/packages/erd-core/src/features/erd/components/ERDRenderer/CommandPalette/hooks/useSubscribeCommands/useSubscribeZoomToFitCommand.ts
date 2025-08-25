import { useEffect } from 'react'
import { useFitScreen } from '../useFitScreen'

export const useSubscribeZoomToFitCommand = () => {
  const { zoomToFit } = useFitScreen()

  // Tidy up ERD when ⇧1 is pressed
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Digit1' && event.shiftKey) {
        zoomToFit()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [zoomToFit])
}
