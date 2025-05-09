import type { Schema as ERDSchema } from '@liam-hq/db-structure'
import type { ComponentType } from 'react'

export interface TableGroupData {
  name?: string
  tables?: string[]
  comment?: string | null
}

export interface ChatbotButtonProps {
  schemaData: ERDSchema
  tableGroups?: Record<string, TableGroupData> | undefined
}

export type ChatbotButtonComponentType =
  | ComponentType<ChatbotButtonProps>
  | undefined
