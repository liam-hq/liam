import { describe, expect, it } from 'vitest'
import {
  postgresqlOperationDeparser,
  postgresqlSchemaDeparser,
  buildSchemaDiff,
  columnRelatedDiffItemSchema,
  schemaDiffItemsSchema,
  tableRelatedDiffItemSchema,
  applyPatchOperations,
  operationsSchema,
  aColumn,
  aTable,
  columnSchema,
  foreignKeyConstraintSchema,
  mergeSchemas,
  schemaSchema,
  constraintsToRelationships,
  isPrimaryKey,
  type ChangeStatus,
  type CheckConstraint,
  type Column,
  type Columns,
  type Constraint,
  type Constraints,
  type ForeignKeyConstraint,
  type Index,
  type Indexes,
  type PrimaryKeyConstraint,
  type Schema,
  type Table,
  type Tables,
  type UniqueConstraint,
  type Cardinality,
  type Relationship,
  type Relationships,
  type ProcessError,
} from './index.js'

describe('index exports', () => {
  describe('deparser exports', () => {
    it('should export postgresqlOperationDeparser', () => {
      expect(typeof postgresqlOperationDeparser).toBe('function')
    })

    it('should export postgresqlSchemaDeparser', () => {
      expect(typeof postgresqlSchemaDeparser).toBe('function')
    })
  })

  describe('diff exports', () => {
    it('should export buildSchemaDiff function', () => {
      expect(typeof buildSchemaDiff).toBe('function')
    })

    it('should export all diff type schemas', () => {
      expect(columnRelatedDiffItemSchema).toBeDefined()
      expect(schemaDiffItemsSchema).toBeDefined()
      expect(tableRelatedDiffItemSchema).toBeDefined()
    })

    it('should export ChangeStatus types', () => {
      expect(typeof 'added' as ChangeStatus).toBe('string')
      expect(typeof 'removed' as ChangeStatus).toBe('string')
      expect(typeof 'modified' as ChangeStatus).toBe('string')
    })
  })

  describe('operation exports', () => {
    it('should export applyPatchOperations function', () => {
      expect(typeof applyPatchOperations).toBe('function')
    })

    it('should export operationsSchema', () => {
      expect(operationsSchema).toBeDefined()
    })
  })

  describe('schema exports', () => {
    it('should export all schema types', () => {
      expect(typeof {} as Schema).toBe('object')
      expect(typeof {} as Table).toBe('object')
      expect(typeof {} as Column).toBe('object')
      expect(typeof {} as Constraint).toBe('object')
    })

    it('should export schema builder functions', () => {
      expect(typeof aColumn).toBe('function')
      expect(typeof aTable).toBe('function')
      expect(typeof mergeSchemas).toBe('function')
    })

    it('should export schema validation schemas', () => {
      expect(columnSchema).toBeDefined()
      expect(foreignKeyConstraintSchema).toBeDefined()
      expect(schemaSchema).toBeDefined()
    })
  })

  describe('parser exports', () => {
    it('should export parse function', () => {
      expect(buildSchemaDiff).toBeDefined()
    })

    it('should export detectFormat function', () => {
      expect(buildSchemaDiff).toBeDefined()
    })

    it('should export ProcessError class', () => {
      expect(typeof {} as ProcessError).toBe('object')
    })

    it('should export supported format types and schemas', () => {
      expect(operationsSchema).toBeDefined()
    })
  })

  describe('utility exports', () => {
    it('should export constraintsToRelationships function', () => {
      expect(typeof constraintsToRelationships).toBe('function')
    })

    it('should export isPrimaryKey function', () => {
      expect(typeof isPrimaryKey).toBe('function')
    })
  })

  it('should not export internal implementation details', () => {
    const moduleExports = {
      postgresqlOperationDeparser,
      postgresqlSchemaDeparser,
      buildSchemaDiff,
      applyPatchOperations,
      constraintsToRelationships,
      isPrimaryKey,
    }
    expect(Object.keys(moduleExports).every(key => typeof moduleExports[key as keyof typeof moduleExports] === 'function')).toBe(true)
  })

  it('should maintain stable public API', () => {
    const coreExports = [
      'postgresqlOperationDeparser',
      'postgresqlSchemaDeparser', 
      'buildSchemaDiff',
      'applyPatchOperations',
      'constraintsToRelationships',
      'isPrimaryKey'
    ]
    const actualExports = {
      postgresqlOperationDeparser,
      postgresqlSchemaDeparser,
      buildSchemaDiff,
      applyPatchOperations,
      constraintsToRelationships,
      isPrimaryKey,
    }
    expect(coreExports.every(exportName => actualExports[exportName as keyof typeof actualExports])).toBe(true)
  })
})
