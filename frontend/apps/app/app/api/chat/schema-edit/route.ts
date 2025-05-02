import { openai } from '@ai-sdk/openai'
import {
  type Operation,
  type Schema,
  operationSchema,
} from '@liam-hq/db-structure'
import { toJsonSchema } from '@valibot/to-json-schema'
import { type Message, streamText } from 'ai'
import { NextResponse } from 'next/server'
import { stringify as stringifyYaml } from 'yaml'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Convert schema data to text format
const convertSchemaToText = (schema: Schema): string => {
  let schemaText = 'FULL DATABASE SCHEMA:\n\n'

  // Process tables
  if (schema.tables) {
    schemaText += 'TABLES:\n\n'
    for (const [tableName, tableData] of Object.entries(schema.tables)) {
      schemaText += `Table: ${tableName}\n`
      if (tableData.comment) {
        schemaText += `Description: ${tableData.comment}\n`
      }

      // Columns
      schemaText += 'Columns:\n'
      if (tableData.columns) {
        for (const [columnName, columnData] of Object.entries(
          tableData.columns,
        )) {
          schemaText += `- ${columnName}: ${columnData.type || 'unknown type'} ${columnData.notNull ? '(not nullable)' : '(nullable)'}\n`
          if (columnData.comment) {
            schemaText += `  Description: ${columnData.comment}\n`
          }
          if (columnData.primary) {
            schemaText += '  Primary Key: true\n'
          }
          if (columnData.unique) {
            schemaText += '  Unique: true\n'
          }
        }
      }

      // Indexes
      if (tableData.indexes && Object.keys(tableData.indexes).length > 0) {
        schemaText += 'Indexes:\n'
        for (const [indexName, indexData] of Object.entries(
          tableData.indexes,
        )) {
          schemaText += `- ${indexName}: `
          if (indexData.unique) {
            schemaText += 'UNIQUE '
          }
          schemaText += `on columns (${indexData.columns.join(', ')})\n`
        }
      }

      schemaText += '\n'
    }
  }

  // Process relationships
  if (schema.relationships) {
    schemaText += 'RELATIONSHIPS:\n\n'
    for (const [relationshipName, relationshipData] of Object.entries(
      schema.relationships,
    )) {
      schemaText += `Relationship: ${relationshipName}\n`
      schemaText += `From Table: ${relationshipData.primaryTableName}, Column: ${relationshipData.primaryColumnName}\n`
      schemaText += `To Table: ${relationshipData.foreignTableName}, Column: ${relationshipData.foreignColumnName}\n`
      schemaText += `Cardinality: ${relationshipData.cardinality}\n`
      schemaText += `Update Constraint: ${relationshipData.updateConstraint}\n`
      schemaText += `Delete Constraint: ${relationshipData.deleteConstraint}\n\n`
    }
  }

  // Process table groups
  if (schema.tableGroups && Object.keys(schema.tableGroups).length > 0) {
    schemaText += 'TABLE GROUPS:\n\n'
    for (const [groupId, groupData] of Object.entries(schema.tableGroups)) {
      schemaText += `Group ID: ${groupId}\n`
      schemaText += `Name: ${String(groupData.name)}\n`

      if (groupData.tables && Array.isArray(groupData.tables)) {
        schemaText += `Tables: ${groupData.tables.join(', ')}\n`
      }

      if (groupData.comment) {
        schemaText += `Comment: ${groupData.comment}\n`
      }

      schemaText += '\n'
    }
  }

  return schemaText
}

// Generate example operations in YAML format for different operation types
const generateOperationExamples = (): string => {
  // Example 1: Adding a new table
  const addTableExample: Operation = {
    type: 'addTable',
    table: {
      name: 'users',
      comment: 'User account information',
      columns: {
        id: {
          name: 'id',
          type: 'uuid',
          default: null,
          check: null,
          primary: true,
          unique: true,
          notNull: true,
          comment: 'Primary key',
        },
        email: {
          name: 'email',
          type: 'text',
          default: null,
          check: null,
          primary: false,
          unique: true,
          notNull: true,
          comment: 'User email address',
        },
      },
      indexes: {},
      constraints: {},
    },
  }

  // Example for deleting an existing table
  const deleteTableExample: Operation = {
    type: 'deleteTable',
    tableName: 'existing_table',
  }

  // Example 2: Adding a column to an existing table
  const addColumnExample: Operation = {
    type: 'addColumn',
    tableName: 'existing_table',
    columnName: 'new_column',
    column: {
      name: 'new_column',
      type: 'text',
      default: null,
      check: null,
      primary: false,
      unique: false,
      notNull: false,
      comment: 'Description of the new column',
    },
  }

  // Example 3: Updating a column's properties
  const updateColumnExample: Operation = {
    type: 'updateColumn',
    tableName: 'users',
    columnName: 'email',
    properties: {
      notNull: true,
      comment: 'Updated description for the email column',
    },
  }

  // Example 4: Changing a table name
  const changeTableExample: Operation = {
    type: 'changeTable',
    changeTable: {
      oldTableName: 'users',
      newTableName: 'accounts',
    },
  }

  // Example 5: Changing a column name
  const changeColumnExample: Operation = {
    type: 'changeColumn',
    changeColumn: {
      tableName: 'users',
      oldColumnName: 'email',
      newColumnName: 'email_address',
    },
  }

  // Example 6: Adding a relationship
  const addRelationshipExample: Operation = {
    type: 'addRelationship',
    relationshipName: 'users_posts',
    relationship: {
      name: 'users_posts',
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'posts',
      foreignColumnName: 'user_id',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'CASCADE',
    },
  }

  // 単一操作の例
  const singleOperationExamples = [
    '# Example 1: Adding a new table',
    stringifyYaml(addTableExample),
    '# Example: Deleting an existing table',
    stringifyYaml(deleteTableExample),
    '# Example 2: Adding a column to an existing table',
    stringifyYaml(addColumnExample),
    "# Example 3: Updating a column's properties",
    stringifyYaml(updateColumnExample),
    '# Example 4: Changing a table name',
    stringifyYaml(changeTableExample),
    '# Example 5: Changing a column name',
    stringifyYaml(changeColumnExample),
    '# Example 6: Adding a relationship',
    stringifyYaml(addRelationshipExample),
  ].join('\n\n')

  // 複数操作の例（関連する複数の操作をまとめて提供する例）
  const multipleOperationsExample = `
# Example 7: Multiple operations in separate YAML blocks
# First operation: Create users table
\`\`\`yaml
type: addTable
table:
  name: users
  comment: User account information
  columns:
    id:
      name: id
      type: uuid
      default: null
      check: null
      primary: true
      unique: true
      notNull: true
      comment: Primary key
    email:
      name: email
      type: text
      default: null
      check: null
      primary: false
      unique: true
      notNull: true
      comment: User email address
  indexes: {}
  constraints: {}
\`\`\`

# Second operation: Create posts table
\`\`\`yaml
type: addTable
table:
  name: posts
  comment: User blog posts
  columns:
    id:
      name: id
      type: uuid
      default: null
      check: null
      primary: true
      unique: true
      notNull: true
      comment: Primary key
    title:
      name: title
      type: text
      default: null
      check: null
      primary: false
      unique: false
      notNull: true
      comment: Post title
    user_id:
      name: user_id
      type: uuid
      default: null
      check: null
      primary: false
      unique: false
      notNull: true
      comment: Reference to user who created the post
  indexes: {}
  constraints: {}
\`\`\`

# Third operation: Add relationship between users and posts
\`\`\`yaml
type: addRelationship
relationshipName: users_posts
relationship:
  name: users_posts
  primaryTableName: users
  primaryColumnName: id
  foreignTableName: posts
  foreignColumnName: user_id
  cardinality: ONE_TO_MANY
  updateConstraint: CASCADE
  deleteConstraint: CASCADE
\`\`\`
`

  // 既存テーブルの同名テーブル作成例
  const recreateTableExample = `
# Example 8: Recreating an existing table
# First operation: Delete the existing table
\`\`\`yaml
type: deleteTable
tableName: users
\`\`\`

# Second operation: Create the table with updated structure
\`\`\`yaml
type: addTable
table:
  name: users
  comment: Updated user account information
  columns:
    id:
      name: id
      type: uuid
      default: null
      check: null
      primary: true
      unique: true
      notNull: true
      comment: Primary key
    email:
      name: email
      type: text
      default: null
      check: null
      primary: false
      unique: true
      notNull: true
      comment: User email address
    full_name:
      name: full_name
      type: text
      default: null
      check: null
      primary: false
      unique: false
      notNull: true
      comment: User's full name
  indexes: {}
  constraints: {}
\`\`\`
`

  return `${singleOperationExamples}\n\n${multipleOperationsExample}\n\n${recreateTableExample}`
}

const operationJsonSchema = toJsonSchema(operationSchema)

export async function POST(request: Request) {
  const { messages, schema, schemaOverride } = await request.json()

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages are required' },
      { status: 400 },
    )
  }

  if (!schema || typeof schema !== 'object') {
    return NextResponse.json(
      { error: 'Valid schema data is required' },
      { status: 400 },
    )
  }

  // Convert schema to text representation
  const schemaText = convertSchemaToText(schema)

  // Generate example operations in YAML
  const operationExamples = generateOperationExamples()

  // Parse existing schema override operations if available
  let currentOperationsText = ''
  if (
    schemaOverride &&
    typeof schemaOverride === 'string' &&
    schemaOverride.trim()
  ) {
    try {
      // Extract operations from YAML override
      currentOperationsText = `
CURRENT SCHEMA OPERATIONS:
The following operations are currently applied to the schema. Consider these when suggesting new operations:

${schemaOverride}
`
    } catch (error) {
      console.error('Error parsing schema override:', error)
      // If there's an error parsing the override, we'll just continue without it
    }
  }

  // Create system prompt with schema context and operation format
  const systemPrompt = `
You are a database schema expert.
Answer questions about the user's schema and provide advice on database design.
Follow these guidelines:

1. Clearly explain the structure of the schema, tables, and relationships.
2. Provide advice based on good database design principles.
3. Share best practices for normalization, indexing, and performance.
4. When using technical terms, include brief explanations.
5. Provide only information directly related to the question, avoiding unnecessary details.
6. Format your responses using GitHub Flavored Markdown (GFM) for better readability.

When suggesting schema changes, provide operations in YAML code blocks.
DO NOT include the full 'overrides' structure - just return the individual operations.

Here are examples of different operation types in YAML format:

\`\`\`yaml
${operationExamples}
\`\`\`

Available operation types:
1. addTable - Add a new table to the schema
2. deleteTable - Remove an existing table from the schema
3. changeTable - Rename an existing table (and update all references)
4. addColumn - Add a new column to an existing table
5. deleteColumn - Remove a column from an existing table
6. changeColumn - Rename an existing column (and update all references)
7. updateColumn - Update properties of an existing column
8. addIndex - Add a new index to an existing table
9. deleteIndex - Remove an index from an existing table
10. addConstraint - Add a constraint to an existing table
11. deleteConstraint - Remove a constraint from an existing table
12. addRelationship - Add a relationship between tables
13. deleteRelationship - Remove a relationship

Each operation must conform to the following JSON schema:

\`\`\`json
${operationJsonSchema}
\`\`\`

Complete Schema Information:
${schemaText}

${currentOperationsText}

Important guidelines for providing schema operations:

1. For simple changes:
   - Provide a single operation in a YAML code block
   - Include a brief explanation of what the operation does

2. For complex changes requiring multiple operations:
   - Break down the changes into separate, focused operations
   - Present each operation in its own separate YAML code block
   - Explain the purpose of each operation and how they work together
   - Present operations in the correct logical order (e.g., create table before adding foreign keys)

3. For related changes (like creating multiple tables that work together):
   - Present each table creation or modification as a separate YAML code block
   - Explain how the tables relate to each other
   - ALWAYS include separate addRelationship operations for any relationships between tables
   - Place relationship operations in separate code blocks after the table definitions

4. For table name uniqueness constraints:
   - Before creating a table with a name that might already exist, check if that table exists
   - If creating a table that might have the same name as an existing table, first include a deleteTable operation
   - When renaming tables, ensure the new name doesn't conflict with existing tables

Critical requirements for common scenarios:

A. When creating multiple related tables:
   - ALWAYS include addRelationship operations for any relationships between tables
   - Don't assume foreign key columns automatically create relationships
   - Each relationship must be explicitly defined with a separate addRelationship operation
   - Without an addRelationship operation, tables will not be connected in the schema even if they have matching column names

B. When creating a table that might already exist:
   - First include a deleteTable operation for that table name
   - Then include the addTable operation with the new table definition
   - If preserving data is important, use changeTable to rename instead
   - Remember that table names must be unique in the schema

Other important requirements:
- Each operation should be in a separate YAML code block (not combined in one block)
- DO NOT include the full 'overrides' structure - just return the individual operations
- Keep operations focused and minimal - only include what's necessary for the specific change
- Validate that any referenced tables, columns, or relationships actually exist in the schema
- When adding tables or columns, always include proper comments for documentation
- Use meaningful names that follow the naming conventions evident in the existing schema

Common pitfalls to avoid:
1. Forgetting to create relationship definitions after creating related tables
2. Trying to create a table with a name that already exists without first deleting it
3. Not checking if referenced tables or columns exist before creating relationships
4. Missing required properties in operation definitions (refer to JSON schema)

Your goal is to help users understand and optimize their database schemas.
When the user asks for schema modifications, carefully identify if multiple operations are needed and provide all required operations in separate YAML blocks.
Always remember to include relationship definitions when creating related tables, and handle table name conflicts appropriately.
`

  // Generate streaming response using Vercel AI SDK
  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: messages as Message[],
  })

  // Return streaming response with custom error handling
  return result.toDataStreamResponse({
    // Custom error message handler
    getErrorMessage: (error) => {
      if (error instanceof Error) return error.message
      return 'AIモデルとの通信中にエラーが発生しました。'
    },
    // Send token usage information to the client
    sendUsage: true,
    // Enable reasoning display
    sendReasoning: true,
  })
}
