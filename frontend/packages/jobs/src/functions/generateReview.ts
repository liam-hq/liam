import { logger } from '@trigger.dev/sdk/v3'
import { toJsonSchema } from '@valibot/to-json-schema'
import type { JSONSchema7 } from 'json-schema'
import { parse } from 'valibot'
import { mastra } from '../mastra'
import { reviewSchema } from './reviewSchema'

const reviewJsonSchema: JSONSchema7 = toJsonSchema(reviewSchema)

const USER_PROMPT = `Pull Request Description:
{prDescription}

Pull Request Comments:
{prComments}

Documentation Context:
{docsContent}

Current Database Schema:
{schema}

File Changes:
{fileChanges}`

export const generateReview = async () => {
  logger.log('Generating review...')

  try {
    // Ensure mastra is properly initialized
    if (!mastra) {
      throw new Error('Mastra instance is not initialized')
    }

    // Check if the agent exists
    const agent = mastra.getAgent('reviewAgent')
    if (!agent) {
      throw new Error('reviewAgent not found in Mastra instance')
    }

    // Generate the review
    const response = await agent.generate(
      [
        {
          role: 'user',
          content: USER_PROMPT,
        },
      ],
      {
        output: reviewJsonSchema,
      },
    )

    logger.log('Review generated successfully')

    const content = response.object
    const parsedContent = parse(reviewSchema, content)

    return parsedContent
  } catch (error) {
    logger.error('Error generating review')
    // Return a minimal valid review object to prevent further errors
    return {
      feedbacks: [
        {
          kind: 'Migration Safety' as const,
          severity: 'WARNING' as const,
          description: `Error generating review: ${error instanceof Error ? error.message : String(error)}`,
          suggestion: 'Please try again or contact support.',
          suggestionSnippets: [],
        },
      ],
      bodyMarkdown:
        'Error generating review. Please try again or contact support.',
    }
  }
}
