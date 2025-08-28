import type { RunnableConfig } from '@langchain/core/runnables'
import { err, ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import { type Testcase, testcaseSchema } from './generateTestcase/agent'

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
  configurable: v.object({
    testcases: v.array(testcaseSchema),
  }),
})

export const getToolConfigurable = (
  config: RunnableConfig,
): Result<{ testcases: Testcase[]; toolCallId: string }, Error> => {
  const configParsed = v.safeParse(configSchema, config)
  if (!configParsed.success) {
    return err(
      new Error(
        `Invalid config structure: ${configParsed.issues
          .map((issue) => issue.message)
          .join(', ')}`,
      ),
    )
  }

  return ok({
    testcases: configParsed.output.configurable.testcases,
    toolCallId: configParsed.output.toolCall.id,
  })
}
