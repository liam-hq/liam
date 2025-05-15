import { SCHEMA_OVERRIDE_FILE_PATH } from '@/features/schemas/constants'
import {
  type Schema,
  overrideSchema,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { getFileContent } from '@liam-hq/github'
import { safeParse } from 'valibot'
import { parse as parseYaml } from 'yaml'

export const safeApplySchemaOverride = async (
  repositoryFullName: string,
  branchOrCommit: string,
  githubInstallationIdentifier: number,
  schema: Schema,
) => {
  const { content: overrideContent } = await getFileContent(
    repositoryFullName,
    SCHEMA_OVERRIDE_FILE_PATH,
    branchOrCommit,
    githubInstallationIdentifier,
  )

  if (overrideContent === null) {
    return {
      result: { schema: schema, tableGroups: {} },
      error: null,
    }
  }

  const parsedOverrideContent = safeParse(
    schemaOverrideSchema,
    parseYaml(overrideContent),
  )

  if (!parsedOverrideContent.success) {
    return {
      result: null,
      error: {
        name: 'ValidationError',
        message: 'Failed to validate schema override file.',
        instruction:
          'Please ensure the override file is in the correct format.',
      },
    }
  }

  return {
    result: overrideSchema(schema, parsedOverrideContent.output),
    error: null,
  }
}
