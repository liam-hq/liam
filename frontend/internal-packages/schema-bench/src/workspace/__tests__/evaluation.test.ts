import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import type { evaluate } from '../../evaluate/evaluate.ts'
import { evaluateSchema } from '../evaluation/evaluation.ts'
import { TestWorkspace } from './testHelpers'

// Mock the evaluate function
vi.mock('../../evaluate/evaluate.ts', () => ({
  evaluate: vi.fn(),
}))

describe('evaluateSchema', () => {
  let mockEvaluate: MockedFunction<typeof evaluate>
  let workspace: TestWorkspace

  const mockEvaluateResult = {
    tableF1Score: 0.9,
    tableAllCorrectRate: 0.8,
    columnF1ScoreAverage: 0.85,
    columnAllCorrectRateAverage: 0.75,
    primaryKeyAccuracyAverage: 0.95,
    constraintAccuracy: 0.88,
    foreignKeyF1Score: 0.92,
    foreignKeyAllCorrectRate: 0.87,
    overallSchemaAccuracy: 0.89,
    tableMapping: { users: 'users' },
    columnMappings: { users: { id: 'id', name: 'name' } },
  }

  beforeEach(async () => {
    const evaluateModule = await import('../../evaluate/evaluate.ts')
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockEvaluate = evaluateModule.evaluate as MockedFunction<typeof evaluate>
    mockEvaluate.mockClear()
    mockEvaluate.mockResolvedValue(mockEvaluateResult)

    workspace = new TestWorkspace()
  })

  afterEach(() => {
    workspace.cleanup()
  })

  describe('evaluateSchema', () => {
    it('should load output and reference data and run evaluation', async () => {
      workspace.createFiles(['case1', 'case2'])

      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationSuccess(result)
      expect(mockEvaluate).toHaveBeenCalledTimes(2)
    })

    it('should run evaluation for specific case when caseId is provided', async () => {
      workspace.createFiles(['case1', 'case2'])

      const result = await evaluateSchema(
        workspace.getConfigWithCaseId('case1'),
      )

      workspace.expectEvaluationSuccess(result)
      expect(mockEvaluate).toHaveBeenCalledTimes(1)
    })

    it('should throw error if output directory does not exist', async () => {
      workspace.removeDirectory('output')

      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationError(result, 'DIRECTORY_NOT_FOUND')
    })

    it('should throw error if reference directory does not exist', async () => {
      workspace.removeDirectory('reference')

      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationError(result, 'DIRECTORY_NOT_FOUND')
    })

    it('should throw error if specific case output schema not found', async () => {
      workspace.createFiles(['case1'])

      const result = await evaluateSchema(
        workspace.getConfigWithCaseId('nonexistent'),
      )

      workspace.expectEvaluationError(result, 'SCHEMA_NOT_FOUND')
    })

    it('should throw error if specific case reference schema not found', async () => {
      workspace.createOutputFile('case1')

      const result = await evaluateSchema(
        workspace.getConfigWithCaseId('case1'),
      )

      workspace.expectEvaluationError(result, 'SCHEMA_NOT_FOUND')
    })

    it('should create summary when multiple results exist', async () => {
      workspace.createFiles(['case1', 'case2'])

      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationSuccess(result)
      workspace.expectSummaryFileCreated()
    })

    it('should handle JSON parsing errors gracefully', async () => {
      workspace.createInvalidJsonFile('case1', 'output')
      workspace.createReferenceFile('case1')

      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationError(result, 'JSON_PARSE_ERROR')
    })

    it('should handle empty directories', async () => {
      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationError(result, 'VALIDATION_ERROR')
    })

    it('should warn about missing reference schemas for some cases', async () => {
      workspace.createOutputFile('case1')
      workspace.createOutputFile('case2')
      workspace.createReferenceFile('case1')
      // case2 reference file is missing

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationSuccess(result)
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  No reference schema found for case: case2',
      )
      expect(mockEvaluate).toHaveBeenCalledTimes(1) // Only case1 should be evaluated

      consoleSpy.mockRestore()
    })

    it('should create individual result files with correct naming', async () => {
      workspace.createFiles(['case1'])

      const result = await evaluateSchema(workspace.config)

      workspace.expectEvaluationSuccess(result)
      const resultFileName = workspace.expectResultFileCreated('case1')
      expect(resultFileName).toBeDefined()

      const content = workspace.getResultFileContent(resultFileName || '')
      expect(content.caseId).toBe('case1')
      expect(content.metrics).toBeDefined()
    })
  })
})
