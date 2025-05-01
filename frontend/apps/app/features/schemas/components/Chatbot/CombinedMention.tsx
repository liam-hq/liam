'use client'

import type React from 'react'
import type { SchemaData, TableGroupData } from '../../../../app/api/chat/route'
import { AgentMention } from './AgentMention'
import styles from './CombinedMention.module.css'
import { SchemaItemMention } from './SchemaItemMention'

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
}) => {
  return (
    <div className={styles.mentionContainer}>
      <div className={styles.mentionSection}>
        <h3 className={styles.mentionSectionTitle}>Agents</h3>
        <AgentMention
          inputValue={inputValue}
          cursorPosition={cursorPosition}
          onSelect={onAgentSelect}
          onClose={onClose}
          containerRef={containerRef}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.mentionSection}>
        <h3 className={styles.mentionSectionTitle}>Schema Items</h3>
        <SchemaItemMention
          inputValue={inputValue}
          cursorPosition={cursorPosition}
          schemaData={schemaData}
          tableGroups={tableGroups}
          onSelect={onSchemaItemSelect}
          onClose={onClose}
          containerRef={containerRef}
        />
      </div>
    </div>
  )
}
