import { END } from '@langchain/langgraph'
import type { testcaseAnnotation } from './testcaseAnnotation'

/**
 * Route after saveToolNode based on whether SQL was successfully saved
 */
export const routeAfterSave = (
  state: typeof testcaseAnnotation.State,
): 'generateTestcase' | typeof END => {
  const { generatedSqls } = state

  if (generatedSqls.length > 0) {
    return END
  }

  return 'generateTestcase'
}
