import { createClient } from '@/libs/db/server'
import { NextRequest, NextResponse } from 'next/server'
import { createNewVersion } from '@/libs/schema/createNewVersion'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.error('GET /api/schemas/[id]/versions')
    const p = await params
    const schemaId = p.id
    console.error('schemaId', schemaId)
    const supabase = await createClient()
    
    // Get the current user's organization
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Verify the schema exists and belongs to the user's organization
    const { data: schema, error: schemaError } = await supabase
      .from('schemas')
      .select('id, organization_id')
      .eq('id', schemaId)
      .single()
    
    if (schemaError || !schema) {
      return NextResponse.json(
        { error: 'Schema not found' },
        { status: 404 }
      )
    }
    
    // Get all versions for the schema
    const { data: versions, error: versionsError } = await supabase
      .from('schema_versions')
      .select('*')
      .eq('schema_id', schemaId)
      .order('number', { ascending: false })

    if (versionsError) {
      console.error('Error fetching schema versions:', versionsError)
      return NextResponse.json(
        { error: 'Failed to fetch schema versions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error in GET /api/schemas/[id]/versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.error('POST /api/schemas/[id]/versions')
    const schemaId = (await params).id
    const supabase = await createClient()
    
    // Get the current user's organization
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Verify the schema exists and belongs to the user's organization
    const { data: schema, error: schemaError } = await supabase
      .from('schemas')
      .select('id, organization_id')
      .eq('id', schemaId)
      .single()
    
    if (schemaError || !schema) {
      return NextResponse.json(
        { error: 'Schema not found' },
        { status: 404 }
      )
    }
   
    // Parse the request body
    const body = await request.json()
    const { latestVersionNumber, title, patch } = body
    
    // Use the helper function to create a new version with optimistic locking
    try {
      const result = await createNewVersion({
        schemaId,
        latestVersionNumber,
        title,
        patch
      })
      
      // Check if there was a version conflict
      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            latestVersionNumber: result.latestVersionNumber
          },
          { status: 409 } // Conflict status code
        )
      }
      
      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error creating schema version:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create schema version' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/schemas/[id]/versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
