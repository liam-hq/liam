'use client'

import { IconButton } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import type { FC } from 'react'
import { useState } from 'react'
import type { TableGroupData } from '../../../../app/api/chat/route'
import { AskAiIcon } from './AskAiIcon'
import styles from './ChatbotButton.module.css'
import { ChatbotDrawer, ChatbotDrawerRoot } from './ChatbotDrawer'
import { type ERDSchema, adaptSchemaForChatbot } from './utils'

interface ChatbotButtonProps {
  schemaData: ERDSchema
  tableGroups?: Record<string, TableGroupData>
}

export const ChatbotButton: FC<ChatbotButtonProps> = ({
  schemaData,
  tableGroups,
}) => {
  const adaptedSchema = adaptSchemaForChatbot(schemaData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <ToolbarButton
        asChild
        onClick={() => setIsDialogOpen(true)}
        className={styles.menuButton}
      >
        <IconButton
          className={styles.menuButton}
          size="md"
          icon={<AskAiIcon size={20} />}
          tooltipContent="Ask AI"
          aria-label="Ask AI"
        />
      </ToolbarButton>

      <ChatbotDrawerRoot
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <ChatbotDrawer schemaData={adaptedSchema} tableGroups={tableGroups} />
      </ChatbotDrawerRoot>
    </>
  )
}
