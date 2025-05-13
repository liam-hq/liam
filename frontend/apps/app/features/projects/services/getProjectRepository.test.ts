import { createClient } from '@/libs/db/server'
import { describe, expect, it } from 'vitest'
import { getProjectRepository } from './getProjectRepository'

describe('getProjectRepository', () => {
  it.skip('should return repository information with the correct structure', async () => {
    const supabase = await createClient()

    // Create test organization
    const { data: organization } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization',
      })
      .select()
      .single()

    // Fail the test if organization doesn't exist
    expect(organization).not.toBeNull()
    if (!organization) {
      throw new Error('Organization is null')
    }

    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project',
        organization_id: organization.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Create test repository
    const { data: repository } = await supabase
      .from('github_repositories')
      .insert({
        name: 'test-repo',
        owner: 'test-owner',
        github_installation_identifier: 12345,
        github_repository_identifier: 67890,
        organization_id: organization.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Fail the test if project or repository doesn't exist
    expect(project).not.toBeNull()
    expect(repository).not.toBeNull()

    if (!project || !repository) {
      throw new Error('Project or repository is null')
    }

    // Create mapping between project and repository
    await supabase.from('project_repository_mappings').insert({
      project_id: project.id,
      repository_id: repository.id,
      updated_at: new Date().toISOString(),
    })

    const result = await getProjectRepository(project.id.toString())

    expect(result).not.toBeNull()
    expect(result?.repository).toHaveProperty('name', 'test-repo')
    expect(result?.repository).toHaveProperty('owner', 'test-owner')
    expect(result?.repository).toHaveProperty(
      'github_installation_identifier',
      12345,
    )
  })

  it('should return null when project does not exist', async () => {
    const result = await getProjectRepository('999999')
    expect(result).toBeNull()
  })
})
