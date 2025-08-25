import { err, fromPromise, type Result } from 'neverthrow'
import OpenAI from 'openai'
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
  ): Promise<Result<OpenAIExecutorOutput, Error>> {
    logInputProcessing(input.input)
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
      return err(handledApiResult.error)
    }

    const content = handledApiResult.value.choices[0]?.message?.content
    if (!content) {
      return err(new Error('No response content from OpenAI'))
    }

    return safeJsonParse<OpenAIExecutorOutput>(
      content,
      'Failed to parse OpenAI JSON response',
    )
  }
}
