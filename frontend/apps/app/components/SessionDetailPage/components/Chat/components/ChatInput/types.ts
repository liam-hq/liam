import type { ReactNode } from 'react'

export type MentionItem = {
  id: string
  label: string
  // eslint-disable-next-line no-restricted-syntax
  type?: 'group' | 'table' | 'column' | 'relation'
  // eslint-disable-next-line no-restricted-syntax
  icon?: ReactNode
  // eslint-disable-next-line no-restricted-syntax
  columnType?: 'primary' | 'foreign' | 'notNull' | 'nullable'
}
