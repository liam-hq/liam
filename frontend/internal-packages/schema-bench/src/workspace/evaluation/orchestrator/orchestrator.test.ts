import type { Schema } from '@liam-hq/db-structure'
import { err, ok, ResultAsync } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaseData, EvaluationConfig, EvaluationResult } from '../../types'
import { loadAndPrepareCases, runAllEvaluations } from './orchestrator'

vi.mock('../casePreparation/casePreparation')
vi.mock('../dataLoader/dataLoader')
vi.mock('../evaluationRunner/evaluationRunner')
vi.mock('../validator/validator')

describe('orchestrator', () => {
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

  const mockConfig: EvaluationConfig = {
    workspacePath: '/test/workspace',
    outputFormat: 'json',
  }

  const mockCaseData: CaseData[] = [
    {
      caseId: 'case1',
      outputSchema: mockSchema,
      referenceSchema: mockSchema,
    },
  ]

  const mockEvaluationResult: EvaluationResult = {
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
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadAndPrepareCases', () => {
    it('should successfully load and prepare cases', async () => {
      const { validateDirectories } = await import('../validator/validator')
      const { loadOutputData, loadReferenceData } = await import(
        '../dataLoader/dataLoader'
      )
      const { prepareCasesToEvaluate } = await import(
        '../casePreparation/casePreparation'
      )

      vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
      vi.mocked(loadOutputData).mockReturnValue(
        ok(new Map([['case1', mockSchema]])),
      )
      vi.mocked(loadReferenceData).mockReturnValue(
        ok(new Map([['case1', mockSchema]])),
      )
      vi.mocked(prepareCasesToEvaluate).mockReturnValue(ok(mockCaseData))

      const result = loadAndPrepareCases(mockConfig)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        cases: mockCaseData,
        workspacePath: '/test/workspace',
      })
      expect(validateDirectories).toHaveBeenCalledWith(mockConfig)
      expect(loadOutputData).toHaveBeenCalledWith('/test/workspace')
      expect(loadReferenceData).toHaveBeenCalledWith('/test/workspace')
    })

    it('should return error when validation fails', async () => {
      const { validateDirectories } = await import('../validator/validator')

      vi.mocked(validateDirectories).mockReturnValue(
        err({ type: 'DIRECTORY_NOT_FOUND', path: '/test' }),
      )

      const result = loadAndPrepareCases(mockConfig)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'DIRECTORY_NOT_FOUND',
        path: '/test',
      })
    })

    it('should return error when loading output data fails', async () => {
      const { validateDirectories } = await import('../validator/validator')
      const { loadOutputData } = await import('../dataLoader/dataLoader')

      vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
      vi.mocked(loadOutputData).mockReturnValue(
        err({
          type: 'FILE_READ_ERROR',
          path: '/test',
          cause: 'Permission denied',
        }),
      )

      const result = loadAndPrepareCases(mockConfig)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'FILE_READ_ERROR',
        path: '/test',
        cause: 'Permission denied',
      })
    })

    it('should return error when loading reference data fails', async () => {
      const { validateDirectories } = await import('../validator/validator')
      const { loadOutputData, loadReferenceData } = await import(
        '../dataLoader/dataLoader'
      )

      vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
      vi.mocked(loadOutputData).mockReturnValue(
        ok(new Map([['case1', mockSchema]])),
      )
      vi.mocked(loadReferenceData).mockReturnValue(
        err({ type: 'JSON_PARSE_ERROR', path: '/test', cause: 'Invalid JSON' }),
      )

      const result = loadAndPrepareCases(mockConfig)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'JSON_PARSE_ERROR',
        path: '/test',
        cause: 'Invalid JSON',
      })
    })

    it('should return error when preparing cases fails', async () => {
      const { validateDirectories } = await import('../validator/validator')
      const { loadOutputData, loadReferenceData } = await import(
        '../dataLoader/dataLoader'
      )
      const { prepareCasesToEvaluate } = await import(
        '../casePreparation/casePreparation'
      )

      vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
      vi.mocked(loadOutputData).mockReturnValue(
        ok(new Map([['case1', mockSchema]])),
      )
      vi.mocked(loadReferenceData).mockReturnValue(
        ok(new Map([['case1', mockSchema]])),
      )
      vi.mocked(prepareCasesToEvaluate).mockReturnValue(
        err({
          type: 'SCHEMA_NOT_FOUND',
          caseId: 'case1',
          schemaType: 'output',
        }),
      )

      const result = loadAndPrepareCases(mockConfig)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'SCHEMA_NOT_FOUND',
        caseId: 'case1',
        schemaType: 'output',
      })
    })

    it('should return error when no cases to evaluate', async () => {
      const { validateDirectories } = await import('../validator/validator')
      const { loadOutputData, loadReferenceData } = await import(
        '../dataLoader/dataLoader'
      )
      const { prepareCasesToEvaluate } = await import(
        '../casePreparation/casePreparation'
      )

      vi.mocked(validateDirectories).mockReturnValue(ok(undefined))
      vi.mocked(loadOutputData).mockReturnValue(ok(new Map()))
      vi.mocked(loadReferenceData).mockReturnValue(ok(new Map()))
      vi.mocked(prepareCasesToEvaluate).mockReturnValue(ok([]))

      const result = loadAndPrepareCases(mockConfig)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'VALIDATION_ERROR',
        message:
          'No cases to evaluate. Make sure output and reference schemas exist.',
      })
    })
  })

  describe('runAllEvaluations', () => {
    it('should successfully run all evaluations', async () => {
      const { runEvaluation } = await import(
        '../evaluationRunner/evaluationRunner'
      )

      vi.mocked(runEvaluation).mockReturnValue(
        ResultAsync.fromSafePromise(Promise.resolve(mockEvaluationResult)),
      )

      const result = await runAllEvaluations(mockCaseData)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual([mockEvaluationResult])
      expect(runEvaluation).toHaveBeenCalledWith(mockCaseData[0])
    })

    it('should handle multiple evaluation cases', async () => {
      const { runEvaluation } = await import(
        '../evaluationRunner/evaluationRunner'
      )

      const multipleCases: CaseData[] = [
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
        {
          caseId: 'case3',
          outputSchema: mockSchema,
          referenceSchema: mockSchema,
        },
      ]

      const multipleResults = multipleCases.map((_, index) => ({
        ...mockEvaluationResult,
        caseId: `case${index + 1}`,
      }))

      vi.mocked(runEvaluation).mockImplementation((caseData) =>
        ResultAsync.fromSafePromise(
          Promise.resolve({
            ...mockEvaluationResult,
            caseId: caseData.caseId,
          }),
        ),
      )

      const result = await runAllEvaluations(multipleCases)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual(multipleResults)
      expect(runEvaluation).toHaveBeenCalledTimes(3)
    })

    it('should return error when any evaluation fails', async () => {
      const { runEvaluation } = await import(
        '../evaluationRunner/evaluationRunner'
      )

      const multipleCases: CaseData[] = [
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
      ]

      vi.mocked(runEvaluation)
        .mockReturnValueOnce(
          ResultAsync.fromSafePromise(Promise.resolve(mockEvaluationResult)),
        )
        .mockReturnValueOnce(
          ResultAsync.fromPromise(
            Promise.reject(new Error('Failed to evaluate')),
            () => ({
              type: 'EVALUATION_ERROR' as const,
              caseId: 'case2',
              cause: 'Failed to evaluate',
            }),
          ),
        )

      const result = await runAllEvaluations(multipleCases)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'EVALUATION_ERROR',
        caseId: 'case2',
        cause: 'Failed to evaluate',
      })
    })

    it('should handle empty case array', async () => {
      const result = await runAllEvaluations([])

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual([])
    })
  })
})
