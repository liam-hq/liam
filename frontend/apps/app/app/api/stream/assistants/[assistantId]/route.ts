import { NextResponse } from 'next/server'

// GET /api/stream/assistants/:assistantId
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  const { assistantId } = await params
  
  // Return assistant info for POC
  return NextResponse.json({
    assistant_id: assistantId,
    name: 'Liam Agent',
    description: 'Database design assistant',
    created_at: new Date().toISOString(),
    metadata: {},
    config: {
      configurable: {
        type: 'agent',
      },
    },
  })
}