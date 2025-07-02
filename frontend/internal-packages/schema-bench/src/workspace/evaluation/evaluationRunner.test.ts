import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaseData } from '../types'
import { runEvaluation } from './evaluationRunner.ts'

// Mock the evaluate function from local package
vi.mock('../../evaluate/evaluate.ts', () => ({
  evaluate: vi.fn(),
}))

describe('runEvaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  const mockCaseData: CaseData = {
    caseId: 'test-case',
    outputSchema: mockSchema,
    referenceSchema: mockSchema,
  }

  const mockEvaluateResult = {
    tableF1Score: 0.9,
    tableAllCorrectRate: 0.85,
    columnF1ScoreAverage: 0.88,
    columnAllCorrectRateAverage: 0.82,
    primaryKeyAccuracyAverage: 0.95,
    constraintAccuracy: 0.9,
    foreignKeyF1Score: 0.87,
    foreignKeyAllCorrectRate: 0.83,
    overallSchemaAccuracy: 0.89,
    tableMapping: { users: 'users' },
    columnMappings: {
      users: { id: 'id' },
    },
  }

  it('should successfully run evaluation and transform results', async () => {
    const { evaluate } = await import('../../evaluate/evaluate.ts')
    vi.mocked(evaluate).mockResolvedValue(mockEvaluateResult)

    const result = await runEvaluation(mockCaseData)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.caseId).toBe('test-case')
      expect(result.value.metrics).toEqual({
        tableF1Score: 0.9,
        tableAllCorrectRate: 0.85,
        columnF1ScoreAverage: 0.88,
        columnAllCorrectRateAverage: 0.82,
        primaryKeyAccuracyAverage: 0.95,
        constraintAccuracy: 0.9,
        foreignKeyF1Score: 0.87,
        foreignKeyAllCorrectRate: 0.83,
        overallSchemaAccuracy: 0.89,
      })
      expect(result.value.tableMapping).toEqual({ users: 'users' })
      expect(result.value.columnMappings).toEqual({
        users: { id: 'id' },
      })
      expect(result.value.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      )
    }

    expect(evaluate).toHaveBeenCalledWith(
      mockCaseData.referenceSchema,
      mockCaseData.outputSchema,
    )
  })

  it('should handle evaluation with missing optional fields', async () => {
    const { evaluate } = await import('../../evaluate/evaluate.ts')

    const minimalEvaluateResult = {
      tableF1Score: 1.0,
      tableAllCorrectRate: 1.0,
      columnF1ScoreAverage: 1.0,
      columnAllCorrectRateAverage: 1.0,
      primaryKeyAccuracyAverage: 1.0,
      constraintAccuracy: 1.0,
      foreignKeyF1Score: 1.0,
      foreignKeyAllCorrectRate: 1.0,
      overallSchemaAccuracy: 1.0,
      tableMapping: {},
      columnMappings: {},
    }

    vi.mocked(evaluate).mockResolvedValue(minimalEvaluateResult)

    const result = await runEvaluation(mockCaseData)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.metrics.tableF1Score).toBe(1.0)
      expect(result.value.tableMapping).toEqual({})
      expect(result.value.columnMappings).toEqual({})
    }
  })

  it('should handle evaluation errors', async () => {
    const { evaluate } = await import('../../evaluate/evaluate.ts')

    vi.mocked(evaluate).mockRejectedValue(new Error('Evaluation failed'))

    const result = await runEvaluation(mockCaseData)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('EVALUATION_ERROR')
      if (result.error.type === 'EVALUATION_ERROR') {
        expect(result.error.caseId).toBe('test-case')
        expect(result.error.cause).toBe('Evaluation failed')
      }
    }
  })

  it('should handle evaluation with different schemas', async () => {
    const { evaluate } = await import('../../evaluate/evaluate.ts')

    const differentSchema: Schema = {
      tables: {
        posts: {
          name: 'posts',
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

    const caseWithDifferentSchemas: CaseData = {
      caseId: 'different-schemas',
      outputSchema: mockSchema,
      referenceSchema: differentSchema,
    }

    vi.mocked(evaluate).mockResolvedValue({
      ...mockEvaluateResult,
      tableF1Score: 0,
      overallSchemaAccuracy: 0,
    })

    const result = await runEvaluation(caseWithDifferentSchemas)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.metrics.tableF1Score).toBe(0)
      expect(result.value.metrics.overallSchemaAccuracy).toBe(0)
    }

    expect(evaluate).toHaveBeenCalledWith(differentSchema, mockSchema)
  })
})
