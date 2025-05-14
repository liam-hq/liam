import { createClient } from '@/libs/db/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
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
    
    // Get the user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    
    if (!orgMember) {
      return NextResponse.json(
        { error: 'User is not a member of any organization' },
        { status: 403 }
      )
    }
    
    // Create a new schema
    const { data: schema, error } = await supabase
      .from('schemas')
      .insert({
        organization_id: orgMember.organization_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating schema:', error)
      return NextResponse.json(
        { error: 'Failed to create schema' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(schema)
  } catch (error) {
    console.error('Error in POST /api/schemas:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
