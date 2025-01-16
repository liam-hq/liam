import { parse } from '@liam-hq/db-structure/parser'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { input, format } = await request.json()

    if (!input || !format) {
      return NextResponse.json(
        { error: 'Input and format are required' },
        { status: 400 },
      )
    }

    const { value: dbStructure, errors } = await parse(input, format)

    for (const error of errors) {
      Sentry.captureException(error)
    }

    const errorObjects = errors.map((error) => ({
      name: error.name,
      message: error.message,
    }))

    return NextResponse.json({ dbStructure, errorObjects })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
