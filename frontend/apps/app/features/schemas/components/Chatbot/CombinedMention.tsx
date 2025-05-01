'use client'

import type React from 'react'
import type { SchemaData, TableGroupData } from '../../../../app/api/chat/route'
import { AgentMention } from './AgentMention'
import styles from './CombinedMention.module.css'
import { SchemaItemMention } from './SchemaItemMention'
import type { ContextPriority } from './utils/detectContextPriority'

interface CombinedMentionProps {
  inputValue: string
  cursorPosition: number
  schemaData: SchemaData
  tableGroups?: Record<string, TableGroupData>
  onAgentSelect: (
    agentId: string,
    agentType: string,
    startPos: number,
    endPos: number,
  ) => void
  onSchemaItemSelect: (itemId: string, startPos: number, endPos: number) => void
  onClose: () => void
  containerRef: React.RefObject<HTMLDivElement>
  contextPriority?: ContextPriority
}

export const CombinedMention: React.FC<CombinedMentionProps> = ({
  inputValue,
  cursorPosition,
  schemaData,
  tableGroups,
  onAgentSelect,
  onSchemaItemSelect,
  onClose,
  containerRef,
  contextPriority = null,
}) => {
  // Determine the order of sections based on context priority
  const showAgentsFirst = contextPriority === 'agent'
  const prioritizeTableGroups = contextPriority === 'tableGroup'

  // Common props for AgentMention
  const agentProps = {
    inputValue,
    cursorPosition,
    onSelect: onAgentSelect,
    onClose,
    containerRef,
  }

  // Common props for SchemaItemMention
  const schemaProps = {
    inputValue,
    cursorPosition,
    schemaData,
    tableGroups,
    onSelect: onSchemaItemSelect,
    onClose,
    containerRef,
    prioritizeTableGroups,
  }

  return (
    <div className={styles.mentionContainer}>
      {showAgentsFirst ? (
        // Show Agents first when agent context is detected
        <>
          <div className={styles.mentionSection}>
            <h3 className={styles.mentionSectionTitle}>Agents</h3>
            <AgentMention {...agentProps} />
          </div>
          <div className={styles.divider} />
          <div className={styles.mentionSection}>
            <h3 className={styles.mentionSectionTitle}>Schema Items</h3>
            <SchemaItemMention {...schemaProps} />
          </div>
        </>
      ) : (
        // Show Schema Items first by default or when schema context is detected
        <>
          <div className={styles.mentionSection}>
            <h3 className={styles.mentionSectionTitle}>Schema Items</h3>
            <SchemaItemMention {...schemaProps} />
          </div>
          <div className={styles.divider} />
          <div className={styles.mentionSection}>
            <h3 className={styles.mentionSectionTitle}>Agents</h3>
            <AgentMention {...agentProps} />
          </div>
        </>
      )}
    </div>
  )
}
