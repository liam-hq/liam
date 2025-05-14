import { createClient } from '@/libs/db/server'
import { type Operation, compare } from 'fast-json-patch'
// Import types from database.types instead of supabase-js directly
import type { Database } from '@liam-hq/db/supabase/database.types'

interface CreateVersionParams {
  schemaId: string
  latestVersionNumber: number
  title: string
  patch: Operation[]
}

interface VersionResponse {
  success: boolean
  id?: string
  schema_id?: string
  number?: number
  title?: string
  patch?: Operation[]
  reverse_patch?: Operation[]
  created_at?: string
  error?: string
  latestVersionNumber?: number
}

export async function createNewVersion({
  schemaId,
  latestVersionNumber,
  title,
  patch
}: CreateVersionParams): Promise<VersionResponse> {
  const supabase = await createClient()
  
  // For first version (latestVersionNumber === 0), we don't need to calculate reverse patch
  let reversePatch: Operation[] | undefined = undefined
  
  if (latestVersionNumber > 0) {
    try {
      // Get all previous versions to reconstruct the content
      const { data: previousVersions, error: previousVersionsError } = await supabase
        .from('schema_versions')
        .select('number, patch')
        .eq('schema_id', schemaId)
        .lte('number', latestVersionNumber)
        .order('number', { ascending: true })
      
      if (previousVersionsError) {
        throw new Error(`Failed to fetch previous versions: ${previousVersionsError.message}`)
      }
      
      if (!previousVersions || previousVersions.length === 0) {
        console.warn('No previous versions found, using empty base content')
        // Continue with empty base content
      }
      
      // Reconstruct the base content (first version)
      let baseContent: Record<string, any> = {}
      
      // Apply all patches in order to get the current content
      let currentContent: Record<string, any> = { ...baseContent }
      
      // Apply all patches in order
      for (const version of previousVersions) {
        // Ensure patch is an array before iterating
        const patchArray = Array.isArray(version.patch) ? version.patch : [];
        if (patchArray.length > 0) {
          // Apply each operation in the patch
          for (const operation of patchArray) {
            try {
              // Type guard to ensure operation has the expected properties
              const op = operation as any;
              if (!op || typeof op !== 'object' || !op.op || !op.path) {
                continue;
              }
              
              // Apply operation to currentContent
              // This is a simplified version - in production, use a proper JSON patch library
              if (op.op === 'replace' || op.op === 'add') {
                const path = op.path.split('/').filter((p: string) => p)
                let current = currentContent
                for (let i = 0; i < path.length - 1; i++) {
                  if (!current[path[i]]) {
                    current[path[i]] = {}
                  }
                  current = current[path[i]]
                }
                current[path[path.length - 1]] = op.value
              } else if (op.op === 'remove') {
                const path = op.path.split('/').filter((p: string) => p)
                let current = currentContent
                for (let i = 0; i < path.length - 1; i++) {
                  if (!current[path[i]]) break
                  current = current[path[i]]
                }
                if (current && path.length > 0) {
                  delete current[path[path.length - 1]]
                }
              }
            } catch (error) {
              console.error('Error applying patch operation:', error)
            }
          }
        }
      }
      
      // Now apply the new patch to get the new content
      let newContent = JSON.parse(JSON.stringify(currentContent))
      for (const operation of patch) {
        try {
          // Type guard to ensure operation has the expected properties
          const op = operation as any;
          if (!op || typeof op !== 'object' || !op.op || !op.path) {
            continue;
          }
          
          // Apply operation to newContent
          if (op.op === 'replace' || op.op === 'add') {
            const path = op.path.split('/').filter((p: string) => p)
            let current = newContent
            for (let i = 0; i < path.length - 1; i++) {
              if (!current[path[i]]) {
                current[path[i]] = {}
              }
              current = current[path[i]]
            }
            current[path[path.length - 1]] = op.value
          } else if (op.op === 'remove') {
            const path = op.path.split('/').filter((p: string) => p)
            let current = newContent
            for (let i = 0; i < path.length - 1; i++) {
              if (!current[path[i]]) break
              current = current[path[i]]
            }
            if (current && path.length > 0) {
              delete current[path[path.length - 1]]
            }
          }
        } catch (error) {
          console.error('Error applying new patch operation:', error)
        }
      }
      
      // Calculate reverse patch from new content to current content
      reversePatch = compare(newContent, currentContent)
    } catch (error) {
      console.error('Error calculating reverse patch:', error)
      // If we can't calculate the reverse patch, we'll proceed without it
      // This is not ideal, but allows the operation to continue
    }
  }
  
  // Since the RPC function might not be available, implement the logic directly
  try {
    // Get the latest version number for this schema
    const { data: latestVersion, error: latestVersionError } = await supabase
      .from('schema_versions')
      .select('number')
      .eq('schema_id', schemaId)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    // If there's an error and it's not a "no rows returned" error, throw it
    if (latestVersionError && !latestVersionError.message.includes('No rows returned')) {
      throw new Error(`Failed to get latest version: ${latestVersionError.message}`)
    }
    
    // Get the actual latest version number
    const actualLatestVersionNumber = latestVersion ? latestVersion.number : 0
    
    // Check if the expected version number matches the actual latest version number
    if (latestVersionNumber !== actualLatestVersionNumber) {
      // Version conflict detected
      return {
        success: false,
        error: 'Version conflict: The schema has been modified since you last loaded it',
        latestVersionNumber: actualLatestVersionNumber
      }
    }
    
    // Calculate the next version number
    const nextVersionNumber = actualLatestVersionNumber + 1
    
    // NOTE: no need to check for duplicates here, as the database will enforce unique constraints!
    // Insert the new version
    const { data: newVersion, error: insertError } = await supabase
      .from('schema_versions')
      .insert({
        schema_id: schemaId,
        number: nextVersionNumber,
        title,
        patch: patch as any,
        reverse_patch: reversePatch as any,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (insertError) {
      throw new Error(`Failed to insert new version: ${insertError.message}`)
    }
    
    // Update the schema's updated_at timestamp
    const { error: updateError } = await supabase
      .from('schemas')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', schemaId)
    
    if (updateError) {
      console.error('Error updating schema timestamp:', updateError)
      // Continue anyway since the version was created successfully
    }
    
    // Return success response
    return {
      success: true,
      id: newVersion.id,
      schema_id: newVersion.schema_id,
      number: newVersion.number,
      title: newVersion.title,
      patch: Array.isArray(newVersion.patch) ? (newVersion.patch as unknown as Operation[]) : undefined,
      reverse_patch: Array.isArray(newVersion.reverse_patch) ? (newVersion.reverse_patch as unknown as Operation[]) : undefined,
      created_at: newVersion.created_at
    }
  } catch (error: any) {
    console.error('Error creating schema version:', error)
    throw new Error(`Failed to create schema version: ${error.message}`)
  }
}
