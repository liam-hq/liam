import { createClient } from '@/libs/db/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const { id: schemaId, versionId } = params
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
    
    // Verify the user has access to the schema's organization
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', schema.organization_id)
      .single()
    
    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Verify the version exists and belongs to the schema
    const { data: version, error: versionError } = await supabase
      .from('schema_versions')
      .select('id')
      .eq('id', versionId)
      .eq('schema_id', schemaId)
      .single()
    
    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }
    
    // Parse the request body
    const body = await request.json()
    const { title } = body
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    // Update the version's title
    const { data: updatedVersion, error: updateError } = await supabase
      .from('schema_versions')
      .update({ title })
      .eq('id', versionId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating schema version:', updateError)
      return NextResponse.json(
        { error: 'Failed to update schema version' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(updatedVersion)
  } catch (error) {
    console.error('Error in PATCH /api/schemas/[id]/versions/[versionId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
