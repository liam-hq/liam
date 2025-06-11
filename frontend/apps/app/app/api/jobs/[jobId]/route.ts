import { type NextRequest, NextResponse } from 'next/server'

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) => {
  try {
    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // File-based job service has been removed
    // This endpoint now returns a not found response
    // In production, this would be replaced with database-based job tracking
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
