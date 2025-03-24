import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { prisma } from '@liam-hq/db'
import type { GenerateReviewPayload, ReviewResponse } from '../types'

const REVIEW_TEMPLATE = `
You are a database design expert.
Please analyze the following schema changes and provide a detailed review.

Documentation Context:
{docsContent}

Schema Files:
{schemaFiles}

Schema Changes:
{schemaChanges}

Please provide a comprehensive review of the database schema changes. Your review should be detailed and constructive.
The response must be a single string containing your detailed review.
`

export async function processGenerateReview(
  payload: GenerateReviewPayload,
): Promise<string> {
  try {
    const docs = await prisma.doc.findMany({
      where: {
        projectId: payload.projectId,
      },
      select: {
        title: true,
        content: true,
      },
    })

    const docsContent = docs
      .map((doc) => `# ${doc.title}\n\n${doc.content}`)
      .join('\n\n---\n\n')
    const prompt = PromptTemplate.fromTemplate(REVIEW_TEMPLATE)

    const model = new ChatOpenAI({
      temperature: 0.7,
      model: 'gpt-4o-mini',
    })

    const chain = prompt.pipe(model)
    const response = await chain.invoke({
      docsContent,
      schemaFiles: payload.schemaFiles,
      schemaChanges: payload.schemaChanges,
    })

    return response.content.toString()
  } catch (error) {
    console.error('Error generating review:', error)
    throw error
  }
}
