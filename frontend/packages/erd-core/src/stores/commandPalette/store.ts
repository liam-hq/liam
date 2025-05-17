import { proxy } from 'valtio'
import type { CommandPalette } from './types'

export const commandPaletteStore = proxy<CommandPalette>({
  open: false,
})
