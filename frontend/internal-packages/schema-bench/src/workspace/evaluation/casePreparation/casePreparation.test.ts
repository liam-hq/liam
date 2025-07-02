import type { Schema } from '@liam-hq/db-structure'
import { describe, expect, it, vi } from 'vitest'
import type { EvaluationConfig } from '../../types'
import { prepareCasesToEvaluate } from './casePreparation'

describe('prepareCasesToEvaluate', () => {
  const mockSchema: Schema = {
    tables: {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            default: null,
            check: null,
            notNull: true,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {},
      },
    },
  }

  const mockOutputData = new Map<string, Schema>([
    ['case1', mockSchema],
    ['case2', mockSchema],
    ['case3', mockSchema],
  ])

  const mockReferenceData = new Map<string, Schema>([
    ['case1', mockSchema],
    ['case2', mockSchema],
  ])

  describe('when evaluating a specific case', () => {
    it('should return the specific case when both output and reference schemas exist', () => {
      const config: EvaluationConfig = {
        workspacePath: '/test/workspace',
        outputFormat: 'json',
        caseId: 'case1',
      }

      const result = prepareCasesToEvaluate(
        config,
        mockOutputData,
        mockReferenceData,
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual([
        {
          caseId: 'case1',
          outputSchema: mockSchema,
          referenceSchema: mockSchema,
        },
      ])
    })

    it('should treat empty string caseId as all cases mode', () => {
      const config: EvaluationConfig = {
        workspacePath: '/test/workspace',
        outputFormat: 'json',
        caseId: '',
      }

      const result = prepareCasesToEvaluate(
        config,
        mockOutputData,
        mockReferenceData,
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual([
        {
          caseId: 'case1',
          outputSchema: mockSchema,
          referenceSchema: mockSchema,
        },
        {
          caseId: 'case2',
          outputSchema: mockSchema,
          referenceSchema: mockSchema,
        },
      ])
    })

    it('should return error when output schema is not found', () => {
      const config: EvaluationConfig = {
        workspacePath: '/test/workspace',
        outputFormat: 'json',
        caseId: 'nonexistent',
      }

      const result = prepareCasesToEvaluate(
        config,
        mockOutputData,
        mockReferenceData,
      )

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'SCHEMA_NOT_FOUND',
        caseId: 'nonexistent',
        schemaType: 'output',
      })
    })

    it('should return error when reference schema is not found', () => {
      const config: EvaluationConfig = {
        workspacePath: '/test/workspace',
        outputFormat: 'json',
        caseId: 'case3',
      }

      const result = prepareCasesToEvaluate(
        config,
        mockOutputData,
        mockReferenceData,
      )

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'SCHEMA_NOT_FOUND',
        caseId: 'case3',
        schemaType: 'reference',
      })
    })
  })

  describe('when evaluating all cases', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    it('should return all cases that have both output and reference schemas', () => {
      const config: EvaluationConfig = {
        workspacePath: '/test/workspace',
        outputFormat: 'json',
      }

      const result = prepareCasesToEvaluate(
        config,
        mockOutputData,
        mockReferenceData,
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual([
        {
          caseId: 'case1',
          outputSchema: mockSchema,
          referenceSchema: mockSchema,
        },
        {
          caseId: 'case2',
          outputSchema: mockSchema,
          referenceSchema: mockSchema,
        },
      ])
    })

    it('should warn about cases with missing reference schemas', () => {
      const config: EvaluationConfig = {
        workspacePath: '/test/workspace',
        outputFormat: 'json',
      }

      prepareCasesToEvaluate(config, mockOutputData, mockReferenceData)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  No reference schema found for case: case3',
      )
    })

    it('should return empty array when no matching cases exist', () => {
      const config: EvaluationConfig = {
        workspacePath: '/test/workspace',
        outputFormat: 'json',
      }

      const emptyReferenceData = new Map<string, Schema>()

      const result = prepareCasesToEvaluate(
        config,
        mockOutputData,
        emptyReferenceData,
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual([])
    })
  })
})
