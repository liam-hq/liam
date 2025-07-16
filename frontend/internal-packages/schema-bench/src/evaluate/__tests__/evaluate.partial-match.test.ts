import { describe, expect, it } from 'vitest'
import { TEST_TIMEOUTS } from '../../testConfig'
import {
  customerSchema,
  customerSimilarSchema,
  similarNamesSchema,
  userAccountSchema,
} from '../__fixtures__/schemas'
import { evaluate } from '../evaluate'

describe('Schema Evaluation - Partial Matching', () => {
  describe('Table Name Similarity', () => {
    it(
      'matches tables with similar names (user_account -> user, blog_post -> post)',
      async () => {
        const result = await evaluate(userAccountSchema, similarNamesSchema)

        // Tables should match due to semantic similarity
        expect(result.tableF1Score).toBeCloseTo(1, 1)
        expect(result.tableAllCorrectRate).toBe(1)

        // Columns should partially match
        expect(result.columnF1ScoreAverage).toBeCloseTo(0.75, 3)
        expect(result.columnAllCorrectRateAverage).toBeCloseTo(0.5, 3)

        // Primary keys should partially match (different column names)
        expect(result.primaryKeyAccuracyAverage).toBeCloseTo(0.5, 3)
      },
      TEST_TIMEOUTS.MODEL_INITIALIZATION,
    )
  })

  describe('Column Name Similarity', () => {
    it(
      'matches columns with similar names (email -> email_address, last_name -> surname)',
      async () => {
        const result = await evaluate(customerSchema, customerSimilarSchema)

        // Perfect table match
        expect(result.tableF1Score).toBe(1)
        expect(result.tableAllCorrectRate).toBe(1)

        // Partial column matches
        expect(result.columnF1ScoreAverage).toBeCloseTo(0.75, 3)
        expect(result.columnAllCorrectRateAverage).toBe(0)

        // Primary key with different name but same table
        expect(result.primaryKeyAccuracyAverage).toBe(1)
      },
      TEST_TIMEOUTS.MODEL_INITIALIZATION,
    )
  })
})
