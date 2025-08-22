export type CommandPaletteInputMode = { type: 'default' } | { type: 'command' }
// upcoming input mode
// | { type: 'column'; tableName: string }

export type CommandPaletteSuggestion =
  | { type: 'table'; name: string }
  | { type: 'command'; name: string }
