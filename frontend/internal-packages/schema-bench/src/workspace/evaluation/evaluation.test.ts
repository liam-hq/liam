import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import type { Schema } from '@liam-hq/db-structure'
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
import type { EvaluationConfig } from '../types'

// Mock the evaluate function
vi.mock('../../evaluate/evaluate.ts', () => ({
  evaluate: vi.fn(),
}))

describe('evaluateSchema', () => {
  let mockEvaluate: MockedFunction<typeof evaluate>
  let tempDir: string

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
          name: {
            name: 'name',
            type: 'varchar',
            default: '',
            check: '',
            notNull: false,
            comment: '',
          },
        },
        indexes: {},
        constraints: {},
      },
    },
  }

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
    const { evaluate } = await import('../../evaluate/evaluate.ts')
    mockEvaluate = evaluate as MockedFunction<typeof evaluate>
    mockEvaluate.mockClear()
    mockEvaluate.mockResolvedValue(mockEvaluateResult)

    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-evaluation-'))

    // Create workspace structure
    const outputDir = path.join(tempDir, 'execution', 'output')
    const referenceDir = path.join(tempDir, 'execution', 'reference')
    const evaluationDir = path.join(tempDir, 'evaluation')

    fs.mkdirSync(outputDir, { recursive: true })
    fs.mkdirSync(referenceDir, { recursive: true })
    fs.mkdirSync(evaluationDir, { recursive: true })
  })

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  const createTestFiles = (cases: string[]) => {
    const outputDir = path.join(tempDir, 'execution', 'output')
    const referenceDir = path.join(tempDir, 'execution', 'reference')

    for (const caseId of cases) {
      fs.writeFileSync(
        path.join(outputDir, `${caseId}.json`),
        JSON.stringify(mockSchema),
      )
      fs.writeFileSync(
        path.join(referenceDir, `${caseId}.json`),
        JSON.stringify(mockSchema),
      )
    }
  }

  describe('evaluateSchema', () => {
    const getConfig = (
      overrides: Partial<EvaluationConfig> = {},
    ): EvaluationConfig => ({
      workspacePath: tempDir,
      outputFormat: 'json',
      ...overrides,
    })

    it('should load output and reference data and run evaluation', async () => {
      createTestFiles(['case1', 'case2'])

      const config = getConfig()
      await evaluateSchema(config)

      expect(mockEvaluate).toHaveBeenCalledTimes(2)
      expect(mockEvaluate).toHaveBeenCalledWith(mockSchema, mockSchema)

      // Check that result files were created
      const evaluationDir = path.join(tempDir, 'evaluation')
      const files = fs.readdirSync(evaluationDir)
      expect(files.length).toBeGreaterThan(0)
    })

    it('should run evaluation for specific case when caseId is provided', async () => {
      createTestFiles(['case1', 'case2'])

      const config = getConfig({ caseId: 'case1' })
      await evaluateSchema(config)

      expect(mockEvaluate).toHaveBeenCalledTimes(1)
      expect(mockEvaluate).toHaveBeenCalledWith(mockSchema, mockSchema)
    })

    it('should throw error if output directory does not exist', async () => {
      // Remove output directory
      fs.rmSync(path.join(tempDir, 'execution', 'output'), {
        recursive: true,
        force: true,
      })

      const config = getConfig()
      await expect(evaluateSchema(config)).rejects.toThrow(
        'Output directory does not exist',
      )
    })

    it('should throw error if reference directory does not exist', async () => {
      // Remove reference directory
      fs.rmSync(path.join(tempDir, 'execution', 'reference'), {
        recursive: true,
        force: true,
      })

      const config = getConfig()
      await expect(evaluateSchema(config)).rejects.toThrow(
        'Reference directory does not exist',
      )
    })

    it('should throw error if specific case output schema not found', async () => {
      createTestFiles(['case1'])

      const config = getConfig({ caseId: 'nonexistent' })
      await expect(evaluateSchema(config)).rejects.toThrow(
        'Output schema not found for case: nonexistent',
      )
    })

    it('should throw error if specific case reference schema not found', async () => {
      // Create only output file, not reference file
      const outputDir = path.join(tempDir, 'execution', 'output')
      fs.writeFileSync(
        path.join(outputDir, 'case1.json'),
        JSON.stringify(mockSchema),
      )

      const config = getConfig({ caseId: 'case1' })
      await expect(evaluateSchema(config)).rejects.toThrow(
        'Reference schema not found for case: case1',
      )
    })

    it('should create summary when multiple results exist', async () => {
      createTestFiles(['case1', 'case2'])

      const config = getConfig()
      await evaluateSchema(config)

      // Check that summary file was created
      const evaluationDir = path.join(tempDir, 'evaluation')
      const files = fs.readdirSync(evaluationDir)
      const summaryFiles = files.filter((file) =>
        file.startsWith('summary_results_'),
      )
      expect(summaryFiles.length).toBe(1)
    })

    it('should handle JSON parsing errors gracefully', async () => {
      // Create invalid JSON file
      const outputDir = path.join(tempDir, 'execution', 'output')
      const referenceDir = path.join(tempDir, 'execution', 'reference')

      fs.writeFileSync(path.join(outputDir, 'case1.json'), 'invalid json')
      fs.writeFileSync(
        path.join(referenceDir, 'case1.json'),
        JSON.stringify(mockSchema),
      )

      const config = getConfig()
      await expect(evaluateSchema(config)).rejects.toThrow()
    })

    it('should handle empty directories', async () => {
      const config = getConfig()
      await expect(evaluateSchema(config)).rejects.toThrow(
        'No cases to evaluate. Make sure output and reference schemas exist.',
      )
    })

    it('should warn about missing reference schemas for some cases', async () => {
      // Create output file but no corresponding reference file
      const outputDir = path.join(tempDir, 'execution', 'output')
      const referenceDir = path.join(tempDir, 'execution', 'reference')

      fs.writeFileSync(
        path.join(outputDir, 'case1.json'),
        JSON.stringify(mockSchema),
      )
      fs.writeFileSync(
        path.join(outputDir, 'case2.json'),
        JSON.stringify(mockSchema),
      )
      fs.writeFileSync(
        path.join(referenceDir, 'case1.json'),
        JSON.stringify(mockSchema),
      )
      // case2 reference file is missing

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const config = getConfig()
      await evaluateSchema(config)

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️  No reference schema found for case: case2',
      )
      expect(mockEvaluate).toHaveBeenCalledTimes(1) // Only case1 should be evaluated

      consoleSpy.mockRestore()
    })

    it('should create individual result files with correct naming', async () => {
      createTestFiles(['case1'])

      const config = getConfig()
      await evaluateSchema(config)

      const evaluationDir = path.join(tempDir, 'evaluation')
      const files = fs.readdirSync(evaluationDir)
      const resultFiles = files.filter((file) =>
        file.includes('case1_results_'),
      )
      expect(resultFiles.length).toBe(1)

      // Check file content
      const resultFile = path.join(evaluationDir, resultFiles[0])
      const content = JSON.parse(fs.readFileSync(resultFile, 'utf-8')) as {
        caseId: string
        metrics: unknown
      }
      expect(content.caseId).toBe('case1')
      expect(content.metrics).toBeDefined()
    })
  })
})
