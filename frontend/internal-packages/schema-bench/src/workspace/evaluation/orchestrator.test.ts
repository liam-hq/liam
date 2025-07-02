import type { Schema } from '@liam-hq/db-structure'
import { err, ok, ResultAsync } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaseData, EvaluationConfig, EvaluationResult } from '../types'
import { loadAndPrepareData, runAllEvaluations } from './orchestrator.ts'

// Mock the dependent modules
vi.mock('./dataLoader.ts', () => ({
  loadOutputData: vi.fn(),
  loadReferenceData: vi.fn(),
}))

vi.mock('./casesPreparer.ts', () => ({
  prepareCasesToEvaluate: vi.fn(),
}))

vi.mock('./evaluationRunner.ts', () => ({
  runEvaluation: vi.fn(),
}))

describe('orchestrator', () => {
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
    caseId: 'case1',
    outputSchema: mockSchema,
    referenceSchema: mockSchema,
  }

  const mockEvaluationResult: EvaluationResult = {
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
    columnMappings: { users: { id: 'id' } },
  }

  describe('loadAndPrepareData', () => {
    const mockConfig: EvaluationConfig = {
      workspacePath: '/test/workspace',
      outputFormat: 'json',
    }

    it('should successfully load and prepare data', async () => {
      const { loadOutputData, loadReferenceData } = await import(
        './dataLoader.ts'
      )
      const { prepareCasesToEvaluate } = await import('./casesPreparer.ts')

      const outputData = new Map([['case1', mockSchema]])
      const referenceData = new Map([['case1', mockSchema]])

      vi.mocked(loadOutputData).mockReturnValue(ok(outputData))
      vi.mocked(loadReferenceData).mockReturnValue(ok(referenceData))
      vi.mocked(prepareCasesToEvaluate).mockReturnValue(ok([mockCaseData]))

      const result = loadAndPrepareData(mockConfig)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.casesToEvaluate).toEqual([mockCaseData])
      }
      expect(loadOutputData).toHaveBeenCalledWith(mockConfig.workspacePath)
      expect(loadReferenceData).toHaveBeenCalledWith(mockConfig.workspacePath)
      expect(prepareCasesToEvaluate).toHaveBeenCalledWith(
        mockConfig,
        outputData,
        referenceData,
      )
    })

    it('should return error when output data loading fails', async () => {
      const { loadOutputData, loadReferenceData } = await import(
        './dataLoader.ts'
      )

      vi.mocked(loadOutputData).mockReturnValue(
        err({ type: 'FILE_READ_ERROR', path: '/test/path', cause: 'error' }),
      )
      vi.mocked(loadReferenceData).mockReturnValue(ok(new Map()))

      const result = loadAndPrepareData(mockConfig)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_READ_ERROR')
      }
    })

    it('should return validation error when no cases to evaluate', async () => {
      const { loadOutputData, loadReferenceData } = await import(
        './dataLoader.ts'
      )
      const { prepareCasesToEvaluate } = await import('./casesPreparer.ts')

      vi.mocked(loadOutputData).mockReturnValue(ok(new Map()))
      vi.mocked(loadReferenceData).mockReturnValue(ok(new Map()))
      vi.mocked(prepareCasesToEvaluate).mockReturnValue(ok([]))

      const result = loadAndPrepareData(mockConfig)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR')
        if (result.error.type === 'VALIDATION_ERROR') {
          expect(result.error.message).toContain('No cases to evaluate')
        }
      }
    })
  })

  describe('runAllEvaluations', () => {
    it('should successfully run evaluations for all cases', async () => {
      const { runEvaluation } = await import('./evaluationRunner.ts')

      const cases: CaseData[] = [
        mockCaseData,
        { ...mockCaseData, caseId: 'case2' },
      ]

      const result1 = { ...mockEvaluationResult, caseId: 'case1' }
      const result2 = { ...mockEvaluationResult, caseId: 'case2' }

      vi.mocked(runEvaluation)
        .mockResolvedValueOnce(ok(result1))
        .mockResolvedValueOnce(ok(result2))

      const result = await runAllEvaluations(cases)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(2)
        expect(result.value[0]?.caseId).toBe('case1')
        expect(result.value[1]?.caseId).toBe('case2')
      }

      expect(runEvaluation).toHaveBeenCalledTimes(2)
      expect(runEvaluation).toHaveBeenCalledWith(cases[0])
      expect(runEvaluation).toHaveBeenCalledWith(cases[1])
    })

    it('should handle empty cases array', async () => {
      const result = await runAllEvaluations([])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([])
      }
    })

    it('should return error when any evaluation fails', async () => {
      const { runEvaluation } = await import('./evaluationRunner.ts')

      const cases: CaseData[] = [
        mockCaseData,
        { ...mockCaseData, caseId: 'case2' },
        { ...mockCaseData, caseId: 'case3' },
      ]

      vi.mocked(runEvaluation)
        .mockResolvedValueOnce(ok(mockEvaluationResult))
        .mockResolvedValueOnce(
          err({
            type: 'EVALUATION_ERROR',
            caseId: 'case2',
            cause: 'evaluation failed',
          }),
        )
        .mockResolvedValueOnce(ok({ ...mockEvaluationResult, caseId: 'case3' }))

      const result = await runAllEvaluations(cases)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('EVALUATION_ERROR')
        if (result.error.type === 'EVALUATION_ERROR') {
          expect(result.error.caseId).toBe('case2')
        }
      }

      // Should have attempted all evaluations even if one fails
      expect(runEvaluation).toHaveBeenCalledTimes(3)
    })

    it('should handle concurrent evaluations', async () => {
      const { runEvaluation } = await import('./evaluationRunner.ts')

      const cases: CaseData[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockCaseData,
        caseId: `case${i}`,
      }))

      vi.mocked(runEvaluation).mockImplementation((caseData) => {
        return ResultAsync.fromPromise(
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ...mockEvaluationResult,
                caseId: caseData.caseId,
              })
            }, 10)
          }),
          () => ({
            type: 'EVALUATION_ERROR' as const,
            caseId: caseData.caseId,
            cause: 'error',
          }),
        )
      })

      const startTime = Date.now()
      const result = await runAllEvaluations(cases)
      const endTime = Date.now()

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(5)
        // Verify results are in the same order as input
        for (let i = 0; i < 5; i++) {
          expect(result.value[i]?.caseId).toBe(`case${i}`)
        }
      }

      // Verify evaluations ran concurrently (should take less time than sequential)
      expect(endTime - startTime).toBeLessThan(100) // Should be much less than 50ms (5 * 10ms)
    })
  })
})
