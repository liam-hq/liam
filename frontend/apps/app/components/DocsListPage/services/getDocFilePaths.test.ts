import { createClient } from '@/libs/db/server'
import { describe, expect, it } from 'vitest'
import { getDocFilePaths } from './getDocFilePaths'

describe('getDocFilePaths', () => {
  it.skip('should return doc file paths with correct structure', async () => {
    const supabase = await createClient()

    const { data: project } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    expect(project).not.toBeNull()

    if (!project) {
      throw new Error('Project is null')
    }

    const { data: docFilePath } = await supabase
      .from('doc_file_paths')
      .insert({
        path: 'test/path.md',
        project_id: project.id,
        is_review_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    expect(docFilePath).not.toBeNull()

    const paths = await getDocFilePaths(project.id.toString())

    expect(paths).not.toBeNull()
    expect(paths.length).toBeGreaterThan(0)
    expect(paths[0]).toHaveProperty('path', 'test/path.md')
    expect(paths[0]).toHaveProperty('is_review_enabled', true)
    expect(paths[0]).toHaveProperty('project_id', project.id)
  })

  it('should return empty array when no paths exist', async () => {
    const paths = await getDocFilePaths('999999')
    expect(paths).toEqual([])
  })
})
