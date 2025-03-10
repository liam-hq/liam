import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { HttpResponseOutputParser } from 'langchain/output_parsers'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const REVIEW_TEMPLATE = `You are a database design expert. Please analyze the following database schema and provide a detailed review.

Include the following points in your review:
1. Overall evaluation of the schema changes
2. Performance
3. Data Integrity
4. Migration Safety
5. Design Consistency
6. Scalability

SchemaChanges:
"""
{schemaChanges}
"""

Please output the review results in Markdown format in English.`

async function fetchSchemaChanges(projectName: string, prNumber: number) {
  try {
    const prApiUrl = `https://api.github.com/repos/${projectName}/pulls/${prNumber}`
    const response = await fetch(`${prApiUrl}/files`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`)
    }

    const files = await response.json()
    const schemaFile = files.find(
      (file: { filename: string | string[] }) =>
        file.filename.includes('schema.prisma') ||
        file.filename.includes('Schemafile') ||
        file.filename.includes('schema.rb') ||
        file.filename.includes('structure.sql'),
    )

    return schemaFile ? schemaFile.patch : null
  } catch (error) {
    console.error('Error fetching PR data:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    // TODO: description is not used yet
    const { projectName, prNumber, title } = data

    if (!projectName || !prNumber || !title) {
      return new Response(JSON.stringify({ error: 'data is not provided' }), {
        status: 400,
      })
    }

    const schemaChanges = await fetchSchemaChanges(projectName, prNumber)

    if (!schemaChanges) {
      return new Response(
        JSON.stringify({ error: 'No Schemafile changes found in the PR' }),
        { status: 400 },
      )
    }

    const prompt = PromptTemplate.fromTemplate(REVIEW_TEMPLATE)

    const model = new ChatOpenAI({
      temperature: 0.7,
      model: 'gpt-4o-mini',
    })

    const outputParser = new HttpResponseOutputParser()

    const chain = prompt.pipe(model).pipe(outputParser)

    const stream = await chain.stream({
      schemaChanges: schemaChanges,
    })

    return new Response(stream)
  } catch (error) {
    console.error('Error in review API:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred while reviewing the schema' }),
      { status: 500 },
    )
  }
}
