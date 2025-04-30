import type { Schema as ERDSchema } from '@liam-hq/db-structure'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import type { ComponentType, FC } from 'react'
import styles from './DesktopToolbar.module.css'
import { FitviewButton } from './FitviewButton'
import { GroupButton } from './GroupButton'
import { ShowModeMenu } from './ShowModeMenu'
import { TidyUpButton } from './TidyUpButton'
import { ZoomControls } from './ZoomControls'

interface TableGroupData {
  name?: string
  tables?: string[]
  comment?: string | null
}

interface ChatbotButtonProps {
  schemaData: ERDSchema
  tableGroups?: Record<string, TableGroupData>
}

type DesktopToolbarProps = {
  withGroupButton?: boolean
  schemaData?: ERDSchema
  tableGroups?: Record<string, TableGroupData>
  ChatbotButtonComponent?: ComponentType<ChatbotButtonProps>
}

export const DesktopToolbar: FC<DesktopToolbarProps> = ({
  withGroupButton = false,
  schemaData,
  tableGroups,
  ChatbotButtonComponent,
}) => {
  return (
    <ToolbarPrimitive.Root className={styles.root} aria-label="Toolbar">
      <ZoomControls />
      <ToolbarPrimitive.Separator className={styles.separator} />
      <div className={styles.buttons}>
        <FitviewButton />
        <TidyUpButton />
        {withGroupButton && <GroupButton />}
        {schemaData && tableGroups && ChatbotButtonComponent && (
          <ChatbotButtonComponent
            schemaData={schemaData}
            tableGroups={tableGroups}
          />
        )}
        {/* TODO: enable once implemented */}
        {/* <ViewControlButton /> */}
      </div>
      <ToolbarPrimitive.Separator className={styles.separator} />
      <ShowModeMenu />
    </ToolbarPrimitive.Root>
  )
}
