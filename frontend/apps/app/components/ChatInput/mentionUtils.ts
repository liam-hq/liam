import type { MentionCandidate } from '../Chat/MentionSuggestor/types'
import type { Column, Relationship, Schema, Table, TableGroup } from './types'

// Function to generate table group candidates
const getTableGroupCandidates = (
  tableGroups?: Record<string, TableGroup>,
): MentionCandidate[] => {
  if (!tableGroups) return []
  return Object.values(tableGroups).map((g) => ({
    id: `group:${g.name}`,
    label: g.name,
    type: 'group',
  }))
}

// Function to generate table candidates
const getTableCandidates = (
  tables?: Record<string, Table>,
): MentionCandidate[] => {
  if (!tables) return []
  return Object.values(tables).map((t) => ({
    id: `table:${t.name}`,
    label: t.name,
    type: 'table',
  }))
}

// Helper function to calculate column properties
const getColumnProperties = (
  table: Table,
  column: Column,
  relationships?: Record<string, Relationship>,
): {
  isSource: boolean | undefined
  targetCardinality: string | undefined
  columnType: 'primary' | 'foreign' | 'notNull' | 'nullable'
} => {
  // isSource: whether this column is the source (primary key side) of a relationship
  const isSource =
    relationships &&
    Object.values(relationships).some(
      (r) =>
        r.primaryTableName === table.name &&
        r.primaryColumnName === column.name,
    )

  // targetCardinality: whether this column is the target (foreign key side) of a relationship
  const targetCardinality =
    relationships &&
    Object.values(relationships).find(
      (r) =>
        r.foreignTableName === table.name &&
        r.foreignColumnName === column.name,
    )?.cardinality

  // Explicitly set the column type
  const columnType = column.primary
    ? 'primary'
    : isSource || !!targetCardinality
      ? 'foreign'
      : column.notNull
        ? 'notNull'
        : 'nullable'

  return { isSource, targetCardinality, columnType }
}

// Function to generate column candidates
const getColumnCandidates = (
  tables?: Record<string, Table>,
  relationships?: Record<string, Relationship>,
): MentionCandidate[] => {
  if (!tables) return []

  return Object.values(tables).flatMap((t) => {
    if (!t.columns) return []

    return Object.values(t.columns).map((c) => {
      // Extract column type determination logic to a separate function
      const { isSource, targetCardinality, columnType } = getColumnProperties(
        t,
        c,
        relationships,
      )

      return {
        id: `column:${t.name}.${c.name}`,
        label: `${t.name}.${c.name}`,
        type: 'column',
        primary: c.primary,
        foreign: c.primary ? false : isSource || !!targetCardinality,
        notNull: c.notNull,
        isSource,
        targetCardinality,
        columnType,
      }
    })
  })
}

// Function to generate relationship candidates
const getRelationshipCandidates = (
  relationships?: Record<string, Relationship>,
): MentionCandidate[] => {
  if (!relationships) return []
  return Object.values(relationships).map((r) => ({
    id: `relation:${r.name}`,
    label: r.name,
    type: 'relation',
  }))
}

// Function to combine all candidates
export const getAllMentionCandidates = (schema: Schema): MentionCandidate[] => {
  return [
    ...getTableGroupCandidates(schema?.tableGroups),
    ...getTableCandidates(schema?.tables),
    ...getColumnCandidates(schema?.tables, schema?.relationships),
    ...getRelationshipCandidates(schema?.relationships),
  ]
}
