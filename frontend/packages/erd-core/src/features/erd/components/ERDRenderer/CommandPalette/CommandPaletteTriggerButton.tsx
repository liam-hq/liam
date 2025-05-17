import { updatePaletteOpen } from '@/stores'
import type { FC } from 'react'

export const CommandPaletteTriggerButton: FC = () => {
  return (
    <button type="button" onClick={() => updatePaletteOpen(true)}>
      search
    </button>
  )
}
