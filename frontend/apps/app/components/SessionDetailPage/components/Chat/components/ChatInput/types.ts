import type { ReactNode } from 'react'

export type MentionItem = {
  id: string
  label: string
  type?: 'group' | 'table' | 'column' | 'relation'
  icon?: ReactNode
  columnType?: 'primary' | 'foreign' | 'notNull' | 'nullable'
}
