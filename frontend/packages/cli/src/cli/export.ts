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
  markdownLines.push('## Tables')

  for (const [tableName, table] of Object.entries(dbStructure.tables)) {
    markdownLines.push(`### ${tableName}`)
    if (table.comment !== null) markdownLines.push(table.comment)
    markdownLines.push(`#### Columns`)
    for (const [columnName, column] of Object.entries(table.columns)) {
      markdownLines.push(`- ${columnName}: ${column.type}`)
      if (column.default !== null && column.default !== '')
        markdownLines.push(`  - Default: ${column.default}`)
      if (column.check !== null && column.check !== '')
        markdownLines.push(`  - Check: ${column.check}`)
      if (column.primary) markdownLines.push(`  - Primary Key`)
      if (column.notNull) markdownLines.push(`  - Not Null`)
      if (column.comment !== null)
        markdownLines.push(`  - Comment: ${column.comment}`)
    }
    markdownLines.push(`#### Indices`)
    for (const [indexName, index] of Object.entries(table.indices)) {
      markdownLines.push(`- ${indexName}`)
      if (index.unique) markdownLines.push(`  - Unique`)
      markdownLines.push(`  - Columns: ${index.columns.join(', ')}`)
    }
  }

  markdownLines.push(`## Relationships`)
  for (const [relationshipName, relationship] of Object.entries(
    dbStructure.relationships,
  )) {
    markdownLines.push(`- ${relationshipName}`)
    markdownLines.push(`  - Primary: ${relationship.primaryTableName}.${relationship.primaryColumnName}`)
    markdownLines.push(`  - Foreign: ${relationship.foreignTableName}.${relationship.foreignColumnName}`)
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
