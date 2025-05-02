import { describe, it, expect } from 'vitest'
import { processSchemaOperations, createOrUpdateSchemaOverride } from './SchemaModifier'
import type { Operation, SchemaOverride } from '@liam-hq/db-structure'

describe('SchemaModifier', () => {
  describe('processSchemaOperations', () => {
    it('detects a single YAML operation', () => {
      const singleOperation = `
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
  indexes: {}
  constraints: {}
\`\`\`
      `
      
      const result = processSchemaOperations(singleOperation)
      
      expect(result.modified).toBe(true)
      expect(result.operations.length).toBe(1)
      expect(result.operationBlocks?.length).toBe(1)
      expect(result.operations[0].type).toBe('addTable')
      expect(result.operationBlocks?.[0].valid).toBe(true)
    })
    
    it('detects multiple YAML operations in separate blocks', () => {
      const multipleOperations = `
Here are the operations needed to create a users and posts schema:

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
  indexes: {}
  constraints: {}
\`\`\`

Next, let's create the posts table:

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
  indexes: {}
  constraints: {}
\`\`\`

Finally, let's add a relationship:

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
      
      const result = processSchemaOperations(multipleOperations)
      
      expect(result.modified).toBe(true)
      expect(result.operations.length).toBe(3)
      expect(result.operationBlocks?.length).toBe(3)
      expect(result.operations[0].type).toBe('addTable')
      expect(result.operations[1].type).toBe('addTable')
      expect(result.operations[2].type).toBe('addRelationship')
      
      expect(result.operationBlocks?.[0].valid).toBe(true)
      expect(result.operationBlocks?.[1].valid).toBe(true)
      expect(result.operationBlocks?.[2].valid).toBe(true)
    })
    
    it('handles invalid YAML gracefully', () => {
      const invalidYaml = `
\`\`\`yaml
type: addTable
table:
  name: users
  comment: User account information
  columns:
    id:
      name: id
      type: uuid
      primary: true
      unique: true
      notNull: true
      comment: Primary key
  indexes: 
    - this is invalid yaml
\`\`\`
      `
      
      const result = processSchemaOperations(invalidYaml)
      
      expect(result.modified).toBe(false)
      expect(result.operations.length).toBe(0)
      expect(result.error).toBeDefined()
      expect(result.operationBlocks?.length).toBe(1)
      expect(result.operationBlocks?.[0].valid).toBe(false)
    })
    
    it('returns valid operations even when some blocks are invalid', () => {
      const mixedOperations = `
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
  indexes: {}
  constraints: {}
\`\`\`

\`\`\`yaml
type: invalidOperation
this: is not valid
\`\`\`

\`\`\`yaml
type: addColumn
tableName: users
columnName: email
column:
  name: email
  type: text
  default: null
  check: null
  primary: false
  unique: true
  notNull: true
  comment: User email address
\`\`\`
      `
      
      const result = processSchemaOperations(mixedOperations)
      
      expect(result.modified).toBe(true)
      expect(result.operations.length).toBe(2)
      expect(result.operationBlocks?.length).toBe(3)
      expect(result.operations[0].type).toBe('addTable')
      expect(result.operations[1].type).toBe('addColumn')
      
      expect(result.operationBlocks?.[0].valid).toBe(true)
      expect(result.operationBlocks?.[1].valid).toBe(false)
      expect(result.operationBlocks?.[2].valid).toBe(true)
    })
  })
  
  describe('createOrUpdateSchemaOverride', () => {
    it('creates a new override with operations when none exists', () => {
      const operations: Operation[] = [
        {
          type: 'addTable',
          table: {
            name: 'users',
            comment: 'User table',
            columns: {},
            indexes: {},
            constraints: {},
          },
        },
      ]
      
      const result = createOrUpdateSchemaOverride(null, operations)
      
      expect(result).toHaveProperty('overrides')
      expect(result.overrides).toHaveProperty('operations')
      expect(result.overrides.operations).toHaveLength(1)
      expect(result.overrides.operations[0].type).toBe('addTable')
    })
    
    it('adds operations to existing override', () => {
      const existingOverride: SchemaOverride = {
        overrides: {
          tables: {},
          tableGroups: {},
          operations: [
            {
              type: 'addTable',
              table: {
                name: 'users',
                comment: 'User table',
                columns: {},
                indexes: {},
                constraints: {},
              },
            },
          ],
        },
      }
      
      const newOperations: Operation[] = [
        {
          type: 'addColumn',
          tableName: 'users',
          columnName: 'email',
          column: {
            name: 'email',
            type: 'text',
            default: null,
            check: null,
            primary: false,
            unique: true,
            notNull: true,
            comment: 'User email',
          },
        },
      ]
      
      const result = createOrUpdateSchemaOverride(existingOverride, newOperations)
      
      expect(result.overrides.operations).toHaveLength(2)
      expect(result.overrides.operations[0].type).toBe('addTable')
      expect(result.overrides.operations[1].type).toBe('addColumn')
    })
    
    it('handles adding multiple operations at once', () => {
      const existingOverride: SchemaOverride = {
        overrides: {
          tables: {},
          tableGroups: {},
          operations: [],
        },
      }
      
      const newOperations: Operation[] = [
        {
          type: 'addTable',
          table: {
            name: 'users',
            comment: 'User table',
            columns: {},
            indexes: {},
            constraints: {},
          },
        },
        {
          type: 'addTable',
          table: {
            name: 'posts',
            comment: 'Posts table',
            columns: {},
            indexes: {},
            constraints: {},
          },
        },
        {
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
        },
      ]
      
      const result = createOrUpdateSchemaOverride(existingOverride, newOperations)
      
      expect(result.overrides.operations).toHaveLength(3)
      expect(result.overrides.operations[0].type).toBe('addTable')
      expect(result.overrides.operations[1].type).toBe('addTable')
      expect(result.overrides.operations[2].type).toBe('addRelationship')
    })
  })
})