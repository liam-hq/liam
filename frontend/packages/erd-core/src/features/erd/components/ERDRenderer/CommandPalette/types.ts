export type InputMode =
  | { type: 'default' }
  | { type: 'table'; name: string }
  | { type: 'command' }

export type Suggestion =
  | { type: 'table'; name: string }
  | { type: 'command'; name: string }
