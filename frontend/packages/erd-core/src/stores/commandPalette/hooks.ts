import { useSnapshot } from 'valtio'
import { commandPaletteStore } from './store'
import type { CommandPalette } from './types'

export const useCommandPaletteStore = () =>
  useSnapshot(commandPaletteStore) as CommandPalette
