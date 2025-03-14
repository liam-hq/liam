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
