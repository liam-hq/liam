import { aColumn, aTable, type Schema } from '@liam-hq/db-structure'
import { describe, expect, it, vi } from 'vitest'
import type { WorkflowState } from '../types'
import { generateDDLNode } from './generateDDLNode'

describe('generateDDLNode', () => {
  const mockLogger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  const mockOnNodeProgress = vi.fn()

  const createMockState = (schemaData: Schema | null): WorkflowState => ({
    userInput: '',
    schemaData: schemaData as Schema,
    logger: mockLogger,
    onNodeProgress: mockOnNodeProgress,
    formattedHistory: '',
    retryCount: {},
    buildingSchemaId: 'test-schema',
    latestVersionNumber: 1,
    userId: 'test-user',
    designSessionId: 'test-session',
    repositories: {} as never,
    ddlStatements: '',
  })

  it('should generate DDL statements from schema data', async () => {
    const mockSchemaData: Schema = {
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'INTEGER',
              notNull: true,
            }),
            name: aColumn({
              name: 'name',
              type: 'VARCHAR',
              notNull: true,
            }),
          },
          constraints: {
            pk_users: {
              type: 'PRIMARY KEY',
              name: 'pk_users',
              columnName: 'id',
            },
          },
        }),
      },
    }

    const state = createMockState(mockSchemaData)
    const result = await generateDDLNode(state)

    expect(result.ddlStatements).toContain('CREATE TABLE "users"')
    expect(result.ddlStatements).toContain('"id" INTEGER NOT NULL')
    expect(result.ddlStatements).toContain('"name" VARCHAR NOT NULL')
    expect(result.ddlStatements).toContain('PRIMARY KEY ("id")')
  })

  it('should handle empty schema data', async () => {
    const mockSchemaData: Schema = {
      tables: {},
    }

    const state = createMockState(mockSchemaData)
    const result = await generateDDLNode(state)

    expect(result.ddlStatements).toBe('')
  })

  it('should handle complex schema with constraints and indexes', async () => {
    const mockSchemaData: Schema = {
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'INTEGER',
              notNull: true,
            }),
            email: aColumn({
              name: 'email',
              type: 'VARCHAR',
              notNull: true,
            }),
          },
          constraints: {
            unique_email: {
              type: 'UNIQUE',
              name: 'unique_email',
              columnName: 'email',
            },
          },
          indexes: {
            idx_email: {
              name: 'idx_email',
              columns: ['email'],
              unique: false,
              type: 'btree',
            },
          },
        }),
      },
    }

    const state = createMockState(mockSchemaData)
    const result = await generateDDLNode(state)

    expect(result.ddlStatements).toContain('CREATE TABLE "users"')
    expect(result.ddlStatements).toContain('CREATE INDEX "idx_email"')
    expect(result.ddlStatements).toContain(
      'ADD CONSTRAINT "unique_email" UNIQUE',
    )
  })

  it('should call onNodeProgress when provided', async () => {
    const mockSchemaData: Schema = { tables: {} }
    const state = createMockState(mockSchemaData)

    await generateDDLNode(state)

    expect(mockOnNodeProgress).toHaveBeenCalledWith(
      'generateDDL',
      expect.any(Number),
    )
  })

  it('should handle errors gracefully', async () => {
    const mockSchemaData = null // Invalid schema data to trigger error
    const state = createMockState(mockSchemaData)

    const result = await generateDDLNode(state)

    expect(result.ddlStatements).toBe(
      'DDL generation failed due to an unexpected error.',
    )
  })
})
