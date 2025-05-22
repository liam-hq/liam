import type * as React from 'react'
import type { ReactNode } from 'react'

export type MentionCandidate = {
  id: string
  label: string
  type?: string // e.g. 'table', 'user', 'command', etc.
  icon?: ReactNode
  columnType?: 'primary' | 'foreign' | 'notNull' | 'nullable'
  [key: string]: unknown
}

export interface MentionSuggestorProps {
  trigger: string // e.g. '@'
  input: string
  caret: number
  candidates: MentionCandidate[]
  noItemsMessage?: string | ReactNode // default: "No items found"
  onSelect: (candidate: MentionCandidate, byKeyboard?: boolean) => void
  onClose?: () => void
  visible: boolean
  className?: string
  filter?: (query: string, candidate: MentionCandidate) => boolean
  onInputProps?: (inputProps: {
    id?: string
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  }) => void
  maxItems?: number // Maximum number of items to display
}
