import type { Schema as ERDSchema } from '@liam-hq/db-structure'
import type { FC } from 'react'

interface TableGroupData {
  name?: string
  tables?: string[]
  comment?: string | null
}

interface ChatbotButtonWrapperProps {
  schemaData: ERDSchema
  tableGroups: Record<string, TableGroupData>
}

export const ChatbotButtonWrapper: FC<ChatbotButtonWrapperProps> = () => {
  // This is a placeholder component that will be replaced by the actual ChatbotButton
  // in the app that imports this package
  return null
}
