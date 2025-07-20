export type InputMode =
  | { type: 'default' }
  | { type: 'column'; tableName: string }
  | { type: 'command' }

export type Suggestion =
  | { type: 'table'; name: string }
  | { type: 'column'; tableName: string; name: string }
  | { type: 'command'; name: string }
