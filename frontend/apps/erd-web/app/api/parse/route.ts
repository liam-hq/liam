import path from 'node:path'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { processor } from '@liam-hq/schema-parser'

export async function POST(request: Request) {
  try {
    const { input, format } = await request.json()

    setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let dbStructure
    let errors = []

    if (format === 'prisma') {
      const { value, errors: _errors } = await processor(input)
      dbStructure = value
      errors = _errors
    } else {
      const { value, errors: _errors } = await parse(input, format)
      dbStructure = value
      errors = _errors
    }

    for (const error of errors) {
      Sentry.captureException(error)
    }

    const errorObjects = errors.map((error: Error) => ({
      name: error.name,
      message: error.message,
    }))

    return NextResponse.json({ dbStructure, errors: errorObjects })
  } catch (error: unknown) {
    console.error(error)
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'An unexpected error occurred'

    return NextResponse.json(
      {
        error: {
          name: 'InternalServerError',
          message: errorMessage,
        },
      },
      { status: 500 },
    )
  }
}
