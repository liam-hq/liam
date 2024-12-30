import path from 'node:path'
import { dbStructureSchema } from '@liam-hq/db-structure'
import { Command } from 'commander'
import fs from 'fs/promises'
import * as v from 'valibot'

const generateMdCommand = new Command('generate-md')
const schemaJsonPath = path.join(process.cwd(), 'dist', 'schema.json')

generateMdCommand.action(async () => {
  const fileContent = await fs.readFile(schemaJsonPath, 'utf-8')
  const json = JSON.parse(fileContent)
  const dbStructure = v.parse(dbStructureSchema, json)
  const markdownLines: string[] = []

  markdownLines.push('# Database Structure')

  for (const [tableName, table] of Object.entries(dbStructure.tables)) {
    markdownLines.push(`## Table: ${tableName}`)
    markdownLines.push(`### Columns`)
    for (const [columnName, column] of Object.entries(table.columns)) {
      markdownLines.push(`- **${columnName}**: ${column.type}`)
      if (column.default !== null)
        markdownLines.push(`  - Default: ${column.default}`)
      if (column.check !== null)
        markdownLines.push(`  - Check: ${column.check}`)
      if (column.primary) markdownLines.push(`  - Primary Key`)
      if (column.unique) markdownLines.push(`  - Unique`)
      if (column.notNull) markdownLines.push(`  - Not Null`)
      if (column.comment !== null)
        markdownLines.push(`  - Comment: ${column.comment}`)
    }
    markdownLines.push(`### Indices`)
    for (const [indexName, index] of Object.entries(table.indices)) {
      markdownLines.push(`- **${indexName}**`)
      markdownLines.push(`  - Unique: ${index.unique}`)
      markdownLines.push(`  - Columns: ${index.columns.join(', ')}`)
    }
    if (table.comment !== null)
      markdownLines.push(`### Comment: ${table.comment}`)
  }

  markdownLines.push(`## Relationships`)
  for (const [relationshipName, relationship] of Object.entries(
    dbStructure.relationships,
  )) {
    markdownLines.push(`- **${relationshipName}**`)
    markdownLines.push(`  - Primary Table: ${relationship.primaryTableName}`)
    markdownLines.push(`  - Primary Column: ${relationship.primaryColumnName}`)
    markdownLines.push(`  - Foreign Table: ${relationship.foreignTableName}`)
    markdownLines.push(`  - Foreign Column: ${relationship.foreignColumnName}`)
    markdownLines.push(`  - Cardinality: ${relationship.cardinality}`)
    markdownLines.push(
      `  - Update Constraint: ${relationship.updateConstraint}`,
    )
    markdownLines.push(
      `  - Delete Constraint: ${relationship.deleteConstraint}`,
    )
  }

  const markdownContent = markdownLines.join('\n')
  const outputPath = path.join(process.cwd(), 'dist', 'schema.md')
  await fs.writeFile(outputPath, markdownContent, 'utf-8')
})

export { generateMdCommand }
