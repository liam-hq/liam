import {
  err,
  fromPromise,
  type Result,
  Result as ResultClass,
} from 'neverthrow'
import OpenAI from 'openai'
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
    const apiResult = await fromPromise(
      this.client.chat.completions.create({
        model: 'o4-mini',
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

    if (apiResult.isErr()) {
      return err(apiResult.error)
    }

    const content = apiResult.value.choices[0]?.message?.content
    if (!content) {
      return err(new Error('No response content from OpenAI'))
    }

    const parseResult = ResultClass.fromThrowable(
      () => JSON.parse(content),
      (error) =>
        error instanceof Error
          ? error
          : new Error('Failed to parse JSON response'),
    )()

    return parseResult
  }
}
