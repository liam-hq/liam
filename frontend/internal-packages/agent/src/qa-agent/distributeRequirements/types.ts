import type { TestCase } from '../../schemas/analyzedRequirements'

/**
 * Test case data structure for parallel SQL generation
 */
export type TestCaseData = {
  category: string
  testcase: TestCase
}
