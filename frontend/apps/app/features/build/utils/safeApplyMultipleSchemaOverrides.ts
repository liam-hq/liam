import { SCHEMA_OVERRIDE_FILE_PATH } from '@/features/schemas/constants'
import { createClient } from '@/libs/db/server'
import {
  type Schema,
  type SchemaOverride,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { getFileContent } from '@liam-hq/github'
import { parse as parseYaml } from 'yaml'
import {
  buildSchemaOverrideFromDB,
  fetchSchemaOverrides,
  getSchemaOverrideSources,
} from './fetchSchemaOverrides'
import { mergeSchemaOverrides } from './mergeSchemaOverrides'

/**
 * Safely retrieves and applies schema overrides from multiple sources
 *
 * @param repositoryFullName Repository full name (owner/repo)
 * @param branchOrCommit Branch or commit ID
 * @param githubInstallationIdentifier GitHub installation ID
 * @param schema Original schema
 * @param projectId Project ID
 * @returns Merged schema and table groups, or error
 */
export const safeApplyMultipleSchemaOverrides = async (
  repositoryFullName: string,
  branchOrCommit: string,
  githubInstallationIdentifier: number,
  schema: Schema,
  projectId: string,
) => {
  try {
    const overrides: SchemaOverride[] = []

    const { content: defaultOverrideContent } = await getFileContent(
      repositoryFullName,
      SCHEMA_OVERRIDE_FILE_PATH,
      branchOrCommit,
      githubInstallationIdentifier,
    )

    if (defaultOverrideContent !== null) {
      try {
        let parsedOverride: SchemaOverride | null = null
        const parsedYaml = parseYaml(defaultOverrideContent)

        if (
          schemaOverrideSchema &&
          typeof schemaOverrideSchema === 'object' &&
          'parse' in schemaOverrideSchema &&
          typeof schemaOverrideSchema.parse === 'function'
        ) {
          parsedOverride = schemaOverrideSchema.parse(parsedYaml)
        }

        if (parsedOverride) {
          overrides.push(parsedOverride)
        }
      } catch (error) {
        console.error('Failed to parse default schema override:', error)
      }
    }

    const overrideSources = await getSchemaOverrideSources(projectId)

    const sourceOverrides = await fetchSchemaOverrides(
      repositoryFullName,
      branchOrCommit,
      githubInstallationIdentifier,
      overrideSources,
    )
    overrides.push(...sourceOverrides)

    const supabase = await createClient()
    const repoNameParts = repositoryFullName.split('/')
    const repoOwner = repoNameParts[0]
    const repoName = repoNameParts[1]

    const { data: repoData } = await supabase
      .from('github_repositories')
      .select('id')
      .eq('name', repoName)
      .eq('owner', repoOwner)
      .single()

    const repositoryId = repoData?.id

    if (repositoryId) {
      const dbOverride = await buildSchemaOverrideFromDB(
        projectId,
        repositoryId,
        branchOrCommit,
        supabase,
      )
      if (dbOverride) {
        overrides.push(dbOverride)
      }
    } else {
      console.error('Repository ID not found for:', repositoryFullName)
    }

    if (overrides.length === 0) {
      return {
        result: { schema, tableGroups: {} },
        error: null,
      }
    }

    const result = mergeSchemaOverrides(schema, overrides)

    return {
      result,
      error: null,
    }
  } catch (error) {
    console.error('Error applying multiple schema overrides:', error)
    return {
      result: null,
      error: {
        name: 'OverrideError',
        message: 'Failed to apply schema overrides.',
        instruction: 'Please check the schema override sources and formats.',
      },
    }
  }
}
