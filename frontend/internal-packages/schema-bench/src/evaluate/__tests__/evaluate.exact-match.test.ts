import { describe, expect, it } from 'vitest'
import { TEST_TIMEOUTS } from '../../testConfig'
import { simpleUserSchema } from '../__fixtures__/schemas'
import { evaluate } from '../evaluate'

describe('Schema Evaluation - Exact Matching', () => {
  it(
    'returns perfect scores when schemas match exactly',
    async () => {
      const result = await evaluate(simpleUserSchema, simpleUserSchema)

      expect(result.tableF1Score).toBe(1)
      expect(result.tableAllCorrectRate).toBe(1)
      expect(result.columnF1ScoreAverage).toBeCloseTo(1)
      expect(result.primaryKeyAccuracyAverage).toBeCloseTo(1)
      expect(result.foreignKeyF1Score).toBe(0) // No foreign keys in test schema
      expect(result.foreignKeyAllCorrectRate).toBe(0)
      expect(result.overallSchemaAccuracy).toBe(1)
    },
    TEST_TIMEOUTS.MODEL_INITIALIZATION,
  )
})
