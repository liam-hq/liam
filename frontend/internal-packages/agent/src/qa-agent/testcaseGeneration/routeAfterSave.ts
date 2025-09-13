import { END } from '@langchain/langgraph'
import type { testcaseAnnotation } from './testcaseAnnotation'

/**
 * Route after saveToolNode based on whether testcases were successfully saved
 */
export const routeAfterSave = (
  state: typeof testcaseAnnotation.State,
): 'generateTestcase' | typeof END => {
  const { testcases } = state

  if (testcases.length > 0) {
    return END
  }

  return 'generateTestcase'
}
