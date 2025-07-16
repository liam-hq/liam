import { err, ok, type Result } from 'neverthrow'
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
      timeout: config.timeout || 120000, // 2 minutes default
    })
  }

  async execute(
    input: OpenAIExecutorInput,
  ): Promise<Result<OpenAIExecutorOutput, Error>> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'o3-mini',
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
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return err(new Error('No response content from OpenAI'))
      }

      const schema: OpenAIExecutorOutput = JSON.parse(content)
      return ok(schema)
    } catch (error) {
      if (error instanceof Error) {
        return err(error)
      }
      return err(new Error('Unknown error occurred'))
    }
  }
}
