import type {
  Column,
  Relationships,
  Schema,
  Table,
  Tables,
} from '@liam-hq/db-structure'
import type { MentionItem } from '../../../types'

// Function to generate table candidates
const getTableCandidates = (tables?: Tables): MentionItem[] => {
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
  relationships?: Relationships,
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
  relationships?: Relationships,
): MentionItem[] => {
  if (!tables) return []

  return Object.values(tables).flatMap((t) => {
    if (!t.columns) return []

    return Object.values(t.columns).map((c) => {
      // Extract column type determination logic to a separate function
      const { columnType } = getColumnProperties(t, c, relationships)

      return {
        id: `column:${t.name}.${c.name}`,
        label: `${t.name}.${c.name}`,
        type: 'column',
        columnType,
      }
    })
  })
}

// Function to generate relationship candidates
const getRelationshipCandidates = (
  relationships?: Relationships,
): MentionItem[] => {
  if (!relationships) return []
  return Object.values(relationships).map((r) => ({
    id: `relation:${r.name}`,
    label: r.name,
    type: 'relation',
  }))
}

// Function to combine all candidates
export const getAllMentionCandidates = (schema: Schema): MentionItem[] => {
  return [
    ...getTableCandidates(schema?.tables),
    ...getColumnCandidates(schema?.tables, schema?.relationships),
    ...getRelationshipCandidates(schema?.relationships),
  ]
}
