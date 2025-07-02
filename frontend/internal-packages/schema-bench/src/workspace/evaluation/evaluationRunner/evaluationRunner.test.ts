import type { Schema } from '@liam-hq/db-structure'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaseData } from '../../types'
import { runEvaluation } from './evaluationRunner'

vi.mock('../../../evaluate/evaluate')

describe('runEvaluation', () => {
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

  const mockCaseData: CaseData = {
    caseId: 'test-case-1',
    outputSchema: mockSchema,
    referenceSchema: mockSchema,
  }

  const mockEvaluateResult = {
    tableF1Score: 0.95,
    tableAllCorrectRate: 0.9,
    columnF1ScoreAverage: 0.88,
    columnAllCorrectRateAverage: 0.85,
    primaryKeyAccuracyAverage: 0.92,
    constraintAccuracy: 0.87,
    foreignKeyF1Score: 0.93,
    foreignKeyAllCorrectRate: 0.89,
    overallSchemaAccuracy: 0.91,
    tableMapping: { users: 'users' },
    columnMappings: { users: { id: 'id' } },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should successfully evaluate a case and return results', async () => {
    const { evaluate } = await import('../../../evaluate/evaluate')
    vi.mocked(evaluate).mockResolvedValue(mockEvaluateResult)

    const result = await runEvaluation(mockCaseData)

    expect(result.isOk()).toBe(true)
    const evaluationResult = result._unsafeUnwrap()

    expect(evaluationResult).toEqual({
      timestamp: '2024-01-01T12:00:00.000Z',
      caseId: 'test-case-1',
      metrics: {
        tableF1Score: 0.95,
        tableAllCorrectRate: 0.9,
        columnF1ScoreAverage: 0.88,
        columnAllCorrectRateAverage: 0.85,
        primaryKeyAccuracyAverage: 0.92,
        constraintAccuracy: 0.87,
        foreignKeyF1Score: 0.93,
        foreignKeyAllCorrectRate: 0.89,
        overallSchemaAccuracy: 0.91,
      },
      tableMapping: { users: 'users' },
      columnMappings: { users: { id: 'id' } },
    })

    expect(evaluate).toHaveBeenCalledWith(
      mockCaseData.referenceSchema,
      mockCaseData.outputSchema,
    )
  })

  it('should handle evaluation errors and return appropriate error', async () => {
    const { evaluate } = await import('../../../evaluate/evaluate')
    const errorMessage = 'Failed to evaluate schemas'
    vi.mocked(evaluate).mockRejectedValue(new Error(errorMessage))

    const result = await runEvaluation(mockCaseData)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'EVALUATION_ERROR',
      caseId: 'test-case-1',
      cause: errorMessage,
    })
  })

  it('should handle non-Error objects thrown during evaluation', async () => {
    const { evaluate } = await import('../../../evaluate/evaluate')
    vi.mocked(evaluate).mockRejectedValue('String error')

    const result = await runEvaluation(mockCaseData)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'EVALUATION_ERROR',
      caseId: 'test-case-1',
      cause: 'Unknown evaluation error',
    })
  })

  it('should include the current timestamp in the result', async () => {
    const { evaluate } = await import('../../../evaluate/evaluate')
    vi.mocked(evaluate).mockResolvedValue(mockEvaluateResult)

    vi.setSystemTime(new Date('2024-12-25T18:30:45Z'))

    const result = await runEvaluation(mockCaseData)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().timestamp).toBe('2024-12-25T18:30:45.000Z')
  })

  it('should map all metrics correctly from evaluate result', async () => {
    const { evaluate } = await import('../../../evaluate/evaluate')
    const customResult = {
      ...mockEvaluateResult,
      tableF1Score: 0.5,
      columnF1ScoreAverage: 0.3,
      overallSchemaAccuracy: 0.4,
    }
    vi.mocked(evaluate).mockResolvedValue(customResult)

    const result = await runEvaluation(mockCaseData)

    expect(result.isOk()).toBe(true)
    const metrics = result._unsafeUnwrap().metrics
    expect(metrics.tableF1Score).toBe(0.5)
    expect(metrics.columnF1ScoreAverage).toBe(0.3)
    expect(metrics.overallSchemaAccuracy).toBe(0.4)
  })
})
