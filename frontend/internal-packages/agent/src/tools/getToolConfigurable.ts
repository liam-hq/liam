import type { RunnableConfig } from '@langchain/core/runnables'
import { fromValibotSafeParse } from '@liam-hq/neverthrow'
import { ok, type Result } from 'neverthrow'
import * as v from 'valibot'
import { type Testcase, testcaseSchema } from '../qa-agent/types'
import type { Repositories } from '../repositories'
import { getConfigurable } from '../utils/getConfigurable'

const toolConfigurableSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
  configurable: v.object({
    testcases: v.array(testcaseSchema),
    ddlStatements: v.string(),
    requiredExtensions: v.array(v.string()),
    designSessionId: v.string(),
    analyzedRequirements: v.object({
      businessRequirement: v.string(),
      functionalRequirements: v.record(v.string(), v.array(v.string())),
      nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
    }),
  }),
})

type ToolConfigurable = {
  repositories: Repositories
  testcases: Testcase[]
  ddlStatements: string
  requiredExtensions: string[]
  designSessionId: string
  analyzedRequirements: {
    businessRequirement: string
    functionalRequirements: Record<string, string[]>
    nonFunctionalRequirements: Record<string, string[]>
  }
  toolCallId: string
}

export const getToolConfigurable = (
  config: RunnableConfig,
): Result<ToolConfigurable, Error> => {
  return getConfigurable(config).andThen((baseConfigurable) => {
    const { repositories } = baseConfigurable

    return fromValibotSafeParse(toolConfigurableSchema, config).andThen(
      (parsed) =>
        ok({
          repositories,
          toolCallId: parsed.toolCall.id,
          ...parsed.configurable,
        }),
    )
  })
}
