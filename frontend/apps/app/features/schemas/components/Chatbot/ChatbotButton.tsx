'use client'

import { Button } from '@liam-hq/ui'
import { MessageCircleIcon } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import type { TableGroupData } from '../../../../app/api/chat/route'
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
      <Button
        className={styles.chatButton}
        onClick={() => setIsDialogOpen(true)}
      >
        <MessageCircleIcon size={20} />
        <span className={styles.buttonText}>Schema Chat</span>
      </Button>

      <ChatbotDrawerRoot
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <ChatbotDrawer schemaData={adaptedSchema} tableGroups={tableGroups} />
      </ChatbotDrawerRoot>
    </>
  )
}
