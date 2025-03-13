import { helloWorldTask } from '@/src/trigger/helloworld'
import { type NextRequest, NextResponse } from 'next/server'

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const name = request.nextUrl.searchParams.get('name') ?? 'World'

  let result = 'hello world task processing initiated'
  try {
    await helloWorldTask.trigger({ name })
  } catch (error) {
    console.error(error)
    result = error instanceof Error ? error.message : 'unknown error'
  }

  return NextResponse.json(
    { message: result },
    { status: 404 }, // NOTE: always 404 for crawler
  )
}
