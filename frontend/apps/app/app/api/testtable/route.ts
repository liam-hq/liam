import { prisma } from '@liam-hq/db'
import { NextResponse } from 'next/server'

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 },
      )
    }

    console.info('POSTGRES_URL:', process.env.POSTGRES_URL)
    console.info('POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL)
    console.info(
      'POSTGRES_URL_NON_POOLING:',
      process.env.POSTGRES_URL_NON_POOLING,
    )
    console.info('POSTGRES_USER:', process.env.POSTGRES_USER)
    console.info('POSTGRES_HOST:', process.env.POSTGRES_HOST)
    console.info('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD)
    console.info('POSTGRES_DATABASE:', process.env.POSTGRES_DATABASE)
    console.info(
      'SUPABASE_SERVICE_ROLE_KEY:',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
    console.info('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY)
    console.info('SUPABASE_URL:', process.env.SUPABASE_URL)
    console.info('SUPABASE_JWT_SECRET:', process.env.SUPABASE_JWT_SECRET)
    console.info(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
    console.info(
      'NEXT_PUBLIC_SUPABASE_URL:',
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    )

    const pullRequest = await prisma.pullRequest.findFirst({
      where: {
        id: 1,
      },
    })

    console.info('query is complete')
    console.info('pullRequest', pullRequest)

    const testRecord = await prisma.testTable.create({
      data: {
        name,
      },
    })

    return NextResponse.json(testRecord, { status: 201 })
  } catch (error) {
    console.error('Error creating TestTable record:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the record' },
      { status: 500 },
    )
  }
}
