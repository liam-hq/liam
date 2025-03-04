import { langfuseLangchainHandler, vectorStore } from '@/lib'
import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { HttpResponseOutputParser } from 'langchain/output_parsers'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const RETRIEVAL_TEMPLATE = `You are a knowledgeable assistant that helps users with their questions by providing accurate and helpful information.

I'll provide you with:
1. The user's query
2. Relevant context retrieved from our knowledge base

Based on this information, please provide a detailed response that:
- Directly addresses the user's question
- Incorporates relevant information from the provided context
- Provides clear explanations and examples where appropriate
- Highlights important considerations or best practices
- Cites specific information from the context when relevant

User Query:
"""
{query}
"""

Relevant Context:
"""
{context}
"""

Instructions for your response:
1. If the context contains relevant information, use it to enhance your answer
2. If the context doesn't contain enough information, acknowledge this and provide the best general guidance you can
3. If you're unsure about something, be transparent about the limitations of your knowledge
4. Format your response in Markdown to improve readability
5. Keep your response practical, specific, and actionable
6. Do not mention that you are using context or reference the retrieval process in your answer

Please provide a comprehensive and helpful response.`

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Query is not provided or is in an invalid format',
        }),
        { status: 400 },
      )
    }

    const retriever = vectorStore.asRetriever({
      searchType: 'similarity',
      k: 5,
    })

    const relevantDocs = await retriever.invoke(query)
    const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n')

    const prompt = PromptTemplate.fromTemplate(RETRIEVAL_TEMPLATE)

    const model = new ChatOpenAI({
      temperature: 0.7,
      model: 'gpt-4o-mini',
    })

    const outputParser = new HttpResponseOutputParser()

    const chain = prompt.pipe(model).pipe(outputParser)

    const stream = await chain.stream(
      {
        query: query,
        context: context,
      },
      {
        callbacks: [langfuseLangchainHandler],
      },
    )

    return new Response(stream)
  } catch (error) {
    console.error('Error in retrieve API:', error)
    return new Response(
      JSON.stringify({
        error: 'An error occurred while retrieving knowledge',
      }),
      { status: 500 },
    )
  }
}
