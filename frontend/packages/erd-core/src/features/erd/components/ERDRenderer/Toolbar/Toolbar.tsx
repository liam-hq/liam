import type { Schema as ERDSchema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { DesktopToolbar } from './DesktopToolbar'
import { MobileToolbar } from './MobileToolbar'
import type { ChatbotButtonComponentType, TableGroupData } from './types'

type ToolbarProps = {
  withGroupButton?: boolean | undefined
  schemaData?: ERDSchema | undefined
  tableGroups?: Record<string, TableGroupData> | undefined
  ChatbotButtonComponent?: ChatbotButtonComponentType
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
