import { NextResponse } from 'next/server'

/**
 * OpenAI TTS API Endpoint
 * Receives text and voice type, and generates audio using OpenAI API
 */
export async function POST(request: Request) {
  try {
    const { text, voice } = await request.json()

    // Input validation
    if (!text || !voice) {
      return NextResponse.json(
        { error: 'Missing required fields: text and voice' },
        { status: 400 },
      )
    }

    // OpenAI API call
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // Standard quality. Use 'tts-1-hd' for high quality
        voice,
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
    }

    // Return audio data as is
    const audioData = await response.arrayBuffer()
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600', // Cache setting (1 hour)
      },
    })
  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 },
    )
  }
}
