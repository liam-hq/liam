import { useEffect } from 'react'
import { useUserEditingOrThrow } from '../../../../../../../stores'

export const useSubscribeShowModeCommand = () => {
  const { setShowMode } = useUserEditingOrThrow()

  // Switch show mode when ⇧2, ⇧3 or ⇧4 is pressed
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Digit2' && event.shiftKey) {
        setShowMode('ALL_FIELDS')
      }
      if (event.code === 'Digit3' && event.shiftKey) {
        setShowMode('TABLE_NAME')
      }
      if (event.code === 'Digit4' && event.shiftKey) {
        setShowMode('KEY_ONLY')
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setShowMode])
}
