import type { Schema } from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import type { EvaluationConfig } from '../types'
import { prepareCasesToEvaluate } from './casesPreparer.ts'

describe('prepareCasesToEvaluate', () => {
  const mockSchema: Schema = {
    tables: {
      users: {
        name: 'users',
        comment: '',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            default: '',
            check: '',
            notNull: true,
            comment: '',
          },
        },
        indexes: {},
        constraints: {},
      },
    },
  }

  const mockConfig: EvaluationConfig = {
    workspacePath: '/test/workspace',
    outputFormat: 'json',
  }

  describe('when evaluating all cases', () => {
    it('should prepare cases for all matching output and reference files', () => {
      const outputData = new Map([
        ['case1', mockSchema],
        ['case2', { ...mockSchema, tables: {} }],
        ['case3', mockSchema], // This one doesn't have a reference
      ])

      const referenceData = new Map([
        ['case1', mockSchema],
        ['case2', { ...mockSchema, tables: {} }],
        ['case4', mockSchema], // This one doesn't have an output
      ])

      const result = prepareCasesToEvaluate(
        mockConfig,
        outputData,
        referenceData,
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(2) // Only case1 and case2 have both output and reference
        expect(result.value[0]).toEqual({
          caseId: 'case1',
          outputSchema: mockSchema,
          referenceSchema: mockSchema,
        })
        expect(result.value[1]).toEqual({
          caseId: 'case2',
          outputSchema: { ...mockSchema, tables: {} },
          referenceSchema: { ...mockSchema, tables: {} },
        })
      }
    })

    it('should return empty array when no matching cases', () => {
      const outputData = new Map([
        ['case1', mockSchema],
        ['case2', mockSchema],
      ])

      const referenceData = new Map([
        ['case3', mockSchema],
        ['case4', mockSchema],
      ])

      const result = prepareCasesToEvaluate(
        mockConfig,
        outputData,
        referenceData,
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(0)
      }
    })

    it('should handle empty data maps', () => {
      const result = prepareCasesToEvaluate(mockConfig, new Map(), new Map())

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(0)
      }
    })
  })

  describe('when evaluating specific case', () => {
    it('should prepare only the specified case', () => {
      const configWithCaseId = { ...mockConfig, caseId: 'case2' }

      const outputData = new Map([
        ['case1', mockSchema],
        ['case2', { ...mockSchema, tables: {} }],
        ['case3', mockSchema],
      ])

      const referenceData = new Map([
        ['case1', mockSchema],
        ['case2', { ...mockSchema, tables: {} }],
        ['case3', mockSchema],
      ])

      const result = prepareCasesToEvaluate(
        configWithCaseId,
        outputData,
        referenceData,
      )

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toEqual({
          caseId: 'case2',
          outputSchema: { ...mockSchema, tables: {} },
          referenceSchema: { ...mockSchema, tables: {} },
        })
      }
    })

    it('should return error when specific case output is missing', () => {
      const configWithCaseId = { ...mockConfig, caseId: 'missing-case' }

      const outputData = new Map([['case1', mockSchema]])
      const referenceData = new Map([
        ['case1', mockSchema],
        ['missing-case', mockSchema],
      ])

      const result = prepareCasesToEvaluate(
        configWithCaseId,
        outputData,
        referenceData,
      )

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('SCHEMA_NOT_FOUND')
        if (result.error.type === 'SCHEMA_NOT_FOUND') {
          expect(result.error.caseId).toBe('missing-case')
        }
      }
    })

    it('should return error when specific case reference is missing', () => {
      const configWithCaseId = { ...mockConfig, caseId: 'missing-case' }

      const outputData = new Map([
        ['case1', mockSchema],
        ['missing-case', mockSchema],
      ])
      const referenceData = new Map([['case1', mockSchema]])

      const result = prepareCasesToEvaluate(
        configWithCaseId,
        outputData,
        referenceData,
      )

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('SCHEMA_NOT_FOUND')
        if (result.error.type === 'SCHEMA_NOT_FOUND') {
          expect(result.error.caseId).toBe('missing-case')
        }
      }
    })
  })

  // Removed error handling tests as they don't apply to the updated function signature
})
