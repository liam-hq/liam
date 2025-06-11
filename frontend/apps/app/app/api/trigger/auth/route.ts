import { auth } from '@trigger.dev/sdk/v3'
import { NextResponse } from 'next/server'

/**
 * Generate public access token for Trigger.dev React Hooks
 * This endpoint should be protected in production
 */
export async function GET() {
  try {
    // In production, add proper authentication here
    const secretKey = process.env.TRIGGER_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Trigger.dev secret key not configured' },
        { status: 500 },
      )
    }

    // Create a public token for client-side monitoring
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          tasks: ['generate-answer'],
        },
      },
    })

    return NextResponse.json({
      accessToken: publicToken,
      baseURL: process.env.TRIGGER_API_URL || 'https://api.trigger.dev',
    })
  } catch (error) {
    console.error('Error generating Trigger.dev public token:', error)

    // Fallback: provide error message for debugging
    return NextResponse.json(
      {
        error: `Failed to generate public token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    )
  }
}
