export type InputMode =
  | { type: 'default' }
  | { type: 'table'; name: string }
  | { type: 'command' }
