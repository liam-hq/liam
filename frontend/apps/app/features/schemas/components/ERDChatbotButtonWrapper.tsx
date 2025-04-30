'use client'

import type { Schema as ERDSchema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { ChatbotButton } from './Chatbot/ChatbotButton'

// This component is used as a wrapper for the ChatbotButton component
// It's passed to the ERDRenderer component in the ERDEditor
export const ChatbotButtonWrapper: FC<{
  schemaData: ERDSchema
  tableGroups?: Record<
    string,
    {
      name?: string
      tables?: string[]
      comment?: string | null
    }
  >
}> = ({ schemaData, tableGroups }) => {
  return <ChatbotButton schemaData={schemaData} tableGroups={tableGroups} />
}
