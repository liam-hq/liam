export type CommandPaletteInputMode =
  | { type: 'default' }
  | { type: 'command' }
  | { type: 'table'; tableName: string }

export type CommandPaletteSuggestion =
  | { type: 'table'; name: string }
  | { type: 'column'; tableName: string; columnName: string }
  | { type: 'command'; name: string }
