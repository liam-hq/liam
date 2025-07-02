import type { Schema } from '@liam-hq/db-structure'
import { err, ok } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaseData, EvaluationConfig, EvaluationResult } from '../types'
import { evaluateSchema } from './evaluation.ts'

// Mock the functions from the same package
vi.mock('./orchestrator.ts', () => ({
  loadAndPrepareData: vi.fn(),
  runAllEvaluations: vi.fn(),
}))

vi.mock('./resultsSaver.ts', () => ({
  saveResults: vi.fn(),
}))

vi.mock('./validator.ts', () => ({
  validateDirectories: vi.fn(),
}))

describe('evaluateSchema', () => {
  const mockConfig: EvaluationConfig = {
    workspacePath: '/test/workspace',
    outputFormat: 'json',
  }

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
    caseId: 'case1',
    outputSchema: mockSchema,
    referenceSchema: mockSchema,
  }

  const mockEvaluationResults: EvaluationResult[] = [
    {
      timestamp: '2024-01-01T00:00:00.000Z',
      caseId: 'case1',
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
      columnMappings: { users: { id: 'id', name: 'name' } },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully evaluate schema with all steps passing', async () => {
    const { validateDirectories } = await import('./validator.ts')
    const { loadAndPrepareData, runAllEvaluations } = await import(
      './orchestrator.ts'
    )
    const { saveResults } = await import('./resultsSaver.ts')

    vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
    vi.mocked(loadAndPrepareData).mockReturnValue(
      ok({ casesToEvaluate: [mockCaseData] }),
    )
    vi.mocked(runAllEvaluations).mockResolvedValue(ok(mockEvaluationResults))
    vi.mocked(saveResults).mockReturnValue(ok(undefined))

    const result = await evaluateSchema(mockConfig)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual(mockEvaluationResults)
    }

    expect(validateDirectories).toHaveBeenCalledWith(mockConfig)
    expect(loadAndPrepareData).toHaveBeenCalledWith(mockConfig)
    expect(runAllEvaluations).toHaveBeenCalledWith([mockCaseData])
    expect(saveResults).toHaveBeenCalledWith(
      mockEvaluationResults,
      mockConfig.workspacePath,
    )
  })

  it('should return error when directory validation fails', async () => {
    const { validateDirectories } = await import('./validator.ts')

    vi.mocked(validateDirectories).mockReturnValue(
      err({ type: 'DIRECTORY_NOT_FOUND', path: '/test/workspace' }),
    )

    const result = await evaluateSchema(mockConfig)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
    }
  })

  it('should return error when data loading fails', async () => {
    const { validateDirectories } = await import('./validator.ts')
    const { loadAndPrepareData } = await import('./orchestrator.ts')

    vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
    vi.mocked(loadAndPrepareData).mockReturnValue(
      err({ type: 'FILE_READ_ERROR', path: '/test/workspace', cause: 'error' }),
    )

    const result = await evaluateSchema(mockConfig)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('FILE_READ_ERROR')
    }
  })

  it('should return error when evaluation fails', async () => {
    const { validateDirectories } = await import('./validator.ts')
    const { loadAndPrepareData, runAllEvaluations } = await import(
      './orchestrator.ts'
    )

    vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
    vi.mocked(loadAndPrepareData).mockReturnValue(
      ok({ casesToEvaluate: [mockCaseData] }),
    )
    vi.mocked(runAllEvaluations).mockResolvedValue(
      err({
        type: 'EVALUATION_ERROR',
        caseId: 'case1',
        cause: 'evaluation failed',
      }),
    )

    const result = await evaluateSchema(mockConfig)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('EVALUATION_ERROR')
    }
  })

  it('should return error when saving results fails', async () => {
    const { validateDirectories } = await import('./validator.ts')
    const { loadAndPrepareData, runAllEvaluations } = await import(
      './orchestrator.ts'
    )
    const { saveResults } = await import('./resultsSaver.ts')

    vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
    vi.mocked(loadAndPrepareData).mockReturnValue(
      ok({ casesToEvaluate: [mockCaseData] }),
    )
    vi.mocked(runAllEvaluations).mockResolvedValue(ok(mockEvaluationResults))
    vi.mocked(saveResults).mockReturnValue(
      err({
        type: 'FILE_WRITE_ERROR',
        path: '/test/evaluation',
        cause: 'error',
      }),
    )

    const result = await evaluateSchema(mockConfig)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('FILE_WRITE_ERROR')
    }
  })

  it('should handle specific case evaluation', async () => {
    const { validateDirectories } = await import('./validator.ts')
    const { loadAndPrepareData, runAllEvaluations } = await import(
      './orchestrator.ts'
    )
    const { saveResults } = await import('./resultsSaver.ts')

    const configWithCaseId = { ...mockConfig, caseId: 'specific-case' }
    const specificCaseData: CaseData = {
      ...mockCaseData,
      caseId: 'specific-case',
    }

    vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
    vi.mocked(loadAndPrepareData).mockReturnValue(
      ok({ casesToEvaluate: [specificCaseData] }),
    )
    vi.mocked(runAllEvaluations).mockResolvedValue(ok(mockEvaluationResults))
    vi.mocked(saveResults).mockReturnValue(ok(undefined))

    const result = await evaluateSchema(configWithCaseId)

    expect(result.isOk()).toBe(true)
    expect(loadAndPrepareData).toHaveBeenCalledWith(configWithCaseId)
  })
})
