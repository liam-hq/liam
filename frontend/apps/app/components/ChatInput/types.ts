import type * as React from 'react'

// Schema-related type definitions
export type TableGroup = { name: string }

export type Column = {
  name: string
  primary?: boolean
  foreign?: boolean
  notNull?: boolean
}

export type Table = { name: string; columns?: Record<string, Column> }

export type Relationship = {
  name: string
  primaryTableName: string
  primaryColumnName: string
  foreignTableName: string
  foreignColumnName: string
  cardinality?: string
}

export type Schema = {
  tableGroups?: Record<string, TableGroup>
  tables?: Record<string, Table>
  relationships?: Record<string, Relationship>
}

// ChatInput component props
export interface ChatInputProps {
  onSendMessage: (message: string) => void
  onCancel?: () => void
  isLoading: boolean
  error?: boolean
  initialMessage?: string
  schema: Schema
}

// Input props for mention suggestor
export type InputProps = {
  id?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}
