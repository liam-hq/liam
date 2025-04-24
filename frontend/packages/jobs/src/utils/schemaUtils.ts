import path from 'node:path'
import {
  type Schema,
  type SchemaOverride,
  overrideSchema,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import { safeParse } from 'valibot'
import { parse as parseYaml } from 'yaml'
import { SCHEMA_OVERRIDE_FILE_PATH } from '../constants'
import { fetchSchemaFileContent } from './githubFileUtils'

type SchemaInfo = {
  schema: Schema // Original schema
  overriddenSchema: Schema // schema with overrides applied
  currentSchemaOverride: SchemaOverride | null // Current schema override
}

/**
 * Fetches schema information and applies overrides
 *
 * @param projectId - The project ID
 * @param branchName - The branch name
 * @param repositoryFullName - The repository full name (owner/name)
 * @param installationId - The installation ID
 * @returns The schema information including original and overridden schema
 */
export const fetchSchemaInfoWithOverrides = async (
  projectId: string,
  branchName: string,
  repositoryFullName: string,
  installationId: number,
): Promise<SchemaInfo> => {
  // Fetch the current schema override file from GitHub
  const { content: currentSchemaOverrideContent } = await getFileContent(
    repositoryFullName,
    SCHEMA_OVERRIDE_FILE_PATH,
    branchName,
    installationId,
  )

  // Parse and validate the current schema override if it exists
  let currentSchemaOverride: SchemaOverride | null = null
  if (currentSchemaOverrideContent) {
    const parsedJson = parseYaml(currentSchemaOverrideContent)
    const result = safeParse(schemaOverrideSchema, parsedJson)

    if (result.success) {
      currentSchemaOverride = result.output
    }
  }

  // Fetch the schema file content
  const { content, format } = await fetchSchemaFileContent(
    projectId,
    branchName,
    repositoryFullName,
    installationId,
  )

  // Parse the schema file
  setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))
  const { value: schema, errors } = await parse(content, format)

  if (errors.length > 0) {
    console.warn('Errors parsing schema file:', errors)
  }

  // Apply overrides to schema if currentSchemaOverride exists
  const overriddenSchema = currentSchemaOverride
    ? overrideSchema(schema, currentSchemaOverride).schema
    : schema

  return {
    schema,
    overriddenSchema,
    currentSchemaOverride,
  }
}
