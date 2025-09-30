import { err, fromPromise, type Result } from 'neverthrow'
import OpenAI from 'openai'
import { getTracer } from '../../tracing/tracer'
import type { TraceContext } from '../../tracing/types'
import {
  handleExecutionResult,
  logInputProcessing,
  safeJsonParse,
} from '../utils.ts'
import { schemaJsonSchema } from './schemaJsonSchema.ts'
import type {
  OpenAIExecutorConfig,
  OpenAIExecutorInput,
  OpenAIExecutorOutput,
} from './types.ts'

export class OpenAIExecutor {
  private client: OpenAI

  constructor(config: OpenAIExecutorConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 300000, // 5 minutes default
    })
  }

  async execute(
    input: OpenAIExecutorInput,
    options?: { traceContext?: TraceContext },
  ): Promise<Result<OpenAIExecutorOutput, Error>> {
    logInputProcessing(input.input)
    const tracer = getTracer()
    const runHandle = await tracer.startRun({
      name: 'openai-executor',
      inputs: { prompt: input.input },
      runType: 'llm',
      tags: ['executor:openai'],
      metadata: { model: 'gpt-5' },
      ...(options?.traceContext ? { traceContext: options.traceContext } : {}),
    })
    const apiResult = await fromPromise(
      this.client.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content:
              'You are a database schema expert. Please generate a database schema from the given text.',
          },
          {
            role: 'user',
            content: `Please generate a database schema from the following text:\n\n${input.input}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'db_schema',
            strict: true,
            schema: schemaJsonSchema,
          },
        },
      }),
      (error) =>
        error instanceof Error ? error : new Error('Unknown error occurred'),
    )

    const handledApiResult = handleExecutionResult(
      apiResult,
      'OpenAI API call failed',
    )
    if (handledApiResult.isErr()) {
      await tracer.endRunError(runHandle, handledApiResult.error)
      return err(handledApiResult.error)
    }

    const content = handledApiResult.value.choices[0]?.message?.content
    if (!content) {
      const e = new Error('No response content from OpenAI')
      await tracer.endRunError(runHandle, e)
      return err(e)
    }

    const parsed = safeJsonParse<OpenAIExecutorOutput>(
      content,
      'Failed to parse OpenAI JSON response',
    )
    if (parsed.isErr()) {
      await tracer.endRunError(runHandle, parsed.error)
      return parsed
    }

    const u = handledApiResult.value.usage
    const usageMetrics = u
      ? {
          prompt_tokens: u.prompt_tokens,
          completion_tokens: u.completion_tokens,
          total_tokens: u.total_tokens,
        }
      : undefined

    await tracer.endRunSuccess(
      runHandle,
      { raw: content, json: parsed.value },
      usageMetrics ? { usage: usageMetrics } : undefined,
    )

    return parsed
  }
}
