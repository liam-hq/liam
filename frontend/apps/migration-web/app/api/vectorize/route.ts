import { vectorizeText, vectorizeUrl } from '@/lib/vectorization'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { url, text } = await req.json()

    if (url && typeof url === 'string') {
      const result = await vectorizeUrl(url)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'URL content vectorized and stored successfully',
          id: result.documentId,
          chunkCount: result.chunkCount,
        }),
        { status: 200 },
      )
    }
    if (text && typeof text === 'string') {
      const result = await vectorizeText(text)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Text content vectorized and stored successfully',
          id: result.documentId,
          chunkCount: result.chunkCount,
        }),
        { status: 200 },
      )
    }
    return new Response(
      JSON.stringify({
        error: 'Neither URL nor text is provided or is in an invalid format',
      }),
      { status: 400 },
    )
  } catch (error) {
    console.error('Error in vectorize API:', error)
    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing the request',
      }),
      { status: 500 },
    )
  }
}
