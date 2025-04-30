import type { Schema as ERDSchema } from '@liam-hq/db-structure'
import type { ComponentType, FC } from 'react'

interface TableGroupData {
  name?: string
  tables?: string[]
  comment?: string | null
}
import { DesktopToolbar } from './DesktopToolbar'
import { MobileToolbar } from './MobileToolbar'

interface ChatbotButtonProps {
  schemaData: ERDSchema
  tableGroups?: Record<string, TableGroupData>
}

type ToolbarProps = {
  withGroupButton?: boolean
  schemaData?: ERDSchema
  tableGroups?: Record<string, TableGroupData>
  ChatbotButtonComponent?: ComponentType<ChatbotButtonProps>
}

export const Toolbar: FC<ToolbarProps> = ({
  withGroupButton = false,
  schemaData,
  tableGroups,
  ChatbotButtonComponent,
}) => {
  return (
    <>
      <MobileToolbar
        withGroupButton={withGroupButton}
        schemaData={schemaData}
        tableGroups={tableGroups}
        ChatbotButtonComponent={ChatbotButtonComponent}
      />
      <DesktopToolbar
        withGroupButton={withGroupButton}
        schemaData={schemaData}
        tableGroups={tableGroups}
        ChatbotButtonComponent={ChatbotButtonComponent}
      />
    </>
  )
}
