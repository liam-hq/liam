import { createNewVersion, operationsSchema } from '@/libs/schema'
import { type NextRequest, NextResponse } from 'next/server'
import * as v from 'valibot'

const requestParamsSchema = v.object({
  latestVersionNumber: v.number(),
  buildingSchemaId: v.string(),
  patch: operationsSchema,
})

export async function POST(request: NextRequest) {
  const requestParams = await request.json()
  const parsedRequestParams = v.safeParse(requestParamsSchema, requestParams)

  if (!parsedRequestParams.success) {
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 },
    )
  }

  const result = await createNewVersion({
    latestVersionNumber: parsedRequestParams.output.latestVersionNumber,
    buildingSchemaId: parsedRequestParams.output.buildingSchemaId,
    patch: parsedRequestParams.output.patch,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 409 }, // Conflict status for version conflicts
    )
  }

  return NextResponse.json(result, { status: 201 })
}
