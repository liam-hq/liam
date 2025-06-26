import type { Schema } from '@liam-hq/db-structure'
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import type { evaluate } from '../../evaluate/evaluate.ts'
import { createEvaluateSchema } from '../evaluation/evaluation.ts'
import type { EvaluationConfig, FileSystemAdapter } from '../types'

// Mock the evaluate function
vi.mock('../../evaluate/evaluate.ts', () => ({
  evaluate: vi.fn(),
}))

describe('evaluateSchema', () => {
  let mockFs: FileSystemAdapter
  let mockEvaluate: MockedFunction<typeof evaluate>
  let evaluateSchema: ReturnType<typeof createEvaluateSchema>

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
            primary: true,
            notNull: true,
            comment: '',
          },
          name: {
            name: 'name',
            type: 'varchar',
            default: '',
            check: '',
            primary: false,
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

    mockFs = {
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      rmSync: vi.fn(),
      readdirSync: vi.fn(),
      copyFileSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
    }
    evaluateSchema = createEvaluateSchema(mockFs)
  })

  describe('evaluateSchema', () => {
    const config: EvaluationConfig = {
      workspacePath: '/test/workspace',
      outputFormat: 'json',
    }

    it('should load output and reference data and run evaluation', async () => {
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>)
        .mockReturnValueOnce(['case1.json', 'case2.json']) // output files
        .mockReturnValueOnce(['case1.json', 'case2.json']) // reference files
      ;(
        mockFs.readFileSync as MockedFunction<typeof mockFs.readFileSync>
      ).mockReturnValue(JSON.stringify(mockSchema))

      await evaluateSchema(config)

      expect(mockFs.readFileSync).toHaveBeenCalledTimes(4) // 2 output + 2 reference
      expect(mockEvaluate).toHaveBeenCalledTimes(2)
      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should run evaluation for specific case when caseId is provided', async () => {
      const configWithCase = { ...config, caseId: 'case1' }
      ;(mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>)
        .mockReturnValueOnce(true) // output dir exists
        .mockReturnValueOnce(true) // reference dir exists
        .mockReturnValue(true) // evaluation dir exists
      ;(mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>)
        .mockReturnValueOnce(['case1.json', 'case2.json']) // output files
        .mockReturnValueOnce(['case1.json', 'case2.json']) // reference files
      ;(
        mockFs.readFileSync as MockedFunction<typeof mockFs.readFileSync>
      ).mockReturnValue(JSON.stringify(mockSchema))

      await evaluateSchema(configWithCase)

      expect(mockEvaluate).toHaveBeenCalledTimes(1)
      expect(mockEvaluate).toHaveBeenCalledWith(mockSchema, mockSchema)
    })

    it('should throw error if output directory does not exist', async () => {
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(false)

      await expect(evaluateSchema(config)).rejects.toThrow(
        'Output directory does not exist',
      )
    })

    it('should throw error if reference directory does not exist', async () => {
      ;(mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>)
        .mockReturnValueOnce(true) // output dir exists
        .mockReturnValueOnce(false) // reference dir doesn't exist
      ;(
        mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>
      ).mockReturnValueOnce(['case1.json']) // output files

      await expect(evaluateSchema(config)).rejects.toThrow(
        'Reference directory does not exist',
      )
    })

    it('should throw error if specific case output schema not found', async () => {
      const configWithCase = { ...config, caseId: 'nonexistent' }
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>)
        .mockReturnValueOnce(['case1.json']) // output files
        .mockReturnValueOnce(['case1.json']) // reference files
      ;(
        mockFs.readFileSync as MockedFunction<typeof mockFs.readFileSync>
      ).mockReturnValue(JSON.stringify(mockSchema))

      await expect(evaluateSchema(configWithCase)).rejects.toThrow(
        'Output schema not found for case: nonexistent',
      )
    })

    it('should throw error if specific case reference schema not found', async () => {
      const configWithCase = { ...config, caseId: 'case1' }
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>)
        .mockReturnValueOnce(['case1.json']) // output files
        .mockReturnValueOnce(['case2.json']) // reference files (different case)
      ;(
        mockFs.readFileSync as MockedFunction<typeof mockFs.readFileSync>
      ).mockReturnValue(JSON.stringify(mockSchema))

      await expect(evaluateSchema(configWithCase)).rejects.toThrow(
        'Reference schema not found for case: case1',
      )
    })

    it('should create summary when multiple results exist', async () => {
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>)
        .mockReturnValueOnce(['case1.json', 'case2.json']) // output files
        .mockReturnValueOnce(['case1.json', 'case2.json']) // reference files
      ;(
        mockFs.readFileSync as MockedFunction<typeof mockFs.readFileSync>
      ).mockReturnValue(JSON.stringify(mockSchema))

      await evaluateSchema(config)

      // Should write individual results + summary
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3) // 2 individual + 1 summary
    })

    it('should handle JSON parsing errors gracefully', async () => {
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>)
        .mockReturnValueOnce(['case1.json']) // output files
        .mockReturnValueOnce(['case1.json']) // reference files
      ;(
        mockFs.readFileSync as MockedFunction<typeof mockFs.readFileSync>
      ).mockReturnValue('invalid json')

      await expect(evaluateSchema(config)).rejects.toThrow()
    })
  })
})
