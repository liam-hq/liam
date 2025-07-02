import { err, ok } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'
import type { CaseData, EvaluationConfig, EvaluationResult } from '../types'
import { evaluateSchema } from './evaluation'

vi.mock('./orchestrator/orchestrator')
vi.mock('./resultSaver/resultSaver')

describe('evaluateSchema', () => {
  const mockConfig: EvaluationConfig = {
    workspacePath: '/test/workspace',
    outputFormat: 'json',
  }

  const mockCases: CaseData[] = [
    {
      caseId: 'case1',
      outputSchema: {
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
      },
      referenceSchema: {
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
      },
    },
  ]

  const mockResults: EvaluationResult[] = [
    {
      caseId: 'case1',
      timestamp: '2024-01-01T00:00:00Z',
      metrics: {
        tableF1Score: 0.9,
        tableAllCorrectRate: 0.8,
        columnF1ScoreAverage: 0.85,
        columnAllCorrectRateAverage: 0.75,
        primaryKeyAccuracyAverage: 0.95,
        constraintAccuracy: 0.88,
        foreignKeyF1Score: 0.92,
        foreignKeyAllCorrectRate: 0.87,
        overallSchemaAccuracy: 0.89,
      },
      tableMapping: { users: 'users' },
      columnMappings: { users: { id: 'id' } },
    },
  ]

  it('should evaluate schemas successfully', async () => {
    const { loadAndPrepareCases, runAllEvaluations } = await import(
      './orchestrator/orchestrator'
    )
    const { displaySummary, saveResults } = await import(
      './resultSaver/resultSaver'
    )

    vi.mocked(loadAndPrepareCases).mockReturnValue(
      ok({
        cases: mockCases,
        workspacePath: mockConfig.workspacePath,
      }),
    )
    vi.mocked(runAllEvaluations).mockResolvedValue(ok(mockResults))
    vi.mocked(saveResults).mockReturnValue(ok(undefined))
    vi.mocked(displaySummary).mockImplementation(() => {})

    const result = await evaluateSchema(mockConfig)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual(mockResults)
    expect(loadAndPrepareCases).toHaveBeenCalledWith(mockConfig)
    expect(runAllEvaluations).toHaveBeenCalledWith(mockCases)
    expect(saveResults).toHaveBeenCalledWith(mockResults, '/test/workspace')
    expect(displaySummary).toHaveBeenCalledWith(mockResults)
  })

  it('should return error when loadAndPrepareCases fails', async () => {
    const { loadAndPrepareCases } = await import('./orchestrator/orchestrator')

    vi.mocked(loadAndPrepareCases).mockReturnValue(
      err({ type: 'DIRECTORY_NOT_FOUND', path: '/test' }),
    )

    const result = await evaluateSchema(mockConfig)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'DIRECTORY_NOT_FOUND',
      path: '/test',
    })
  })

  it('should return error when runAllEvaluations fails', async () => {
    const { loadAndPrepareCases, runAllEvaluations } = await import(
      './orchestrator/orchestrator'
    )

    vi.mocked(loadAndPrepareCases).mockReturnValue(
      ok({
        cases: mockCases,
        workspacePath: mockConfig.workspacePath,
      }),
    )
    vi.mocked(runAllEvaluations).mockResolvedValue(
      err({
        type: 'EVALUATION_ERROR',
        caseId: 'case1',
        cause: 'Failed to evaluate',
      }),
    )

    const result = await evaluateSchema(mockConfig)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'EVALUATION_ERROR',
      caseId: 'case1',
      cause: 'Failed to evaluate',
    })
  })

  it('should return error when saveResults fails', async () => {
    const { loadAndPrepareCases, runAllEvaluations } = await import(
      './orchestrator/orchestrator'
    )
    const { saveResults } = await import('./resultSaver/resultSaver')

    vi.mocked(loadAndPrepareCases).mockReturnValue(
      ok({
        cases: mockCases,
        workspacePath: mockConfig.workspacePath,
      }),
    )
    vi.mocked(runAllEvaluations).mockResolvedValue(ok(mockResults))
    vi.mocked(saveResults).mockReturnValue(
      err({
        type: 'FILE_WRITE_ERROR',
        path: '/test/evaluation',
        cause: 'Permission denied',
      }),
    )

    const result = await evaluateSchema(mockConfig)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'FILE_WRITE_ERROR',
      path: '/test/evaluation',
      cause: 'Permission denied',
    })
  })
})
