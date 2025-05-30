import { commandPaletteStore } from './store'

export const updatePaletteOpen = (open: boolean) => {
  commandPaletteStore.open = open
}
