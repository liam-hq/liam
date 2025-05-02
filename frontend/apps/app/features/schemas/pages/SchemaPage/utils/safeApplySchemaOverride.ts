import {
  type Schema,
  overrideSchema,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { getFileContent } from '@liam-hq/github'
import { safeParse } from 'valibot'
import { parse as parseYaml } from 'yaml'
import { SCHEMA_OVERRIDE_FILE_PATH } from '../../../constants'

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
      result: { schema: schema, tableGroups: {}, requests: undefined },
      error: null,
    }
  }

  const parsedOverrideContent = safeParse(
    schemaOverrideSchema,
    parseYaml(overrideContent),
  )

  if (!parsedOverrideContent.success) {
    console.error(
      'error',
      JSON.stringify(parsedOverrideContent.issues, null, 2),
    )
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
    // @ts-ignore
    result: overrideSchema(schema, parsedOverrideContent.output),
    error: null,
  }
}
