import { createClient } from '@/libs/db/server'
import { describe, expect, it } from 'vitest'
import { getProjects } from './getProjects'

describe('getProjects', () => {
  it.skip('should return projects with the correct structure', async () => {
    const supabase = await createClient()
    await supabase.from('projects').insert({
      name: 'Test Project',
      updated_at: new Date().toISOString(),
    })

    const projects = await getProjects()

    // Check the structure of the first project
    const project = projects?.[0]
    expect(project).toHaveProperty('id')
    expect(project).toHaveProperty('name')
    expect(project).toHaveProperty('created_at')
  })
})
