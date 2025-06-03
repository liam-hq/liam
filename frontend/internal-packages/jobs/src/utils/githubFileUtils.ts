import {
  type SupportedFormat,
  supportedFormatSchema,
} from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import { safeParse } from 'valibot'
import { createClient } from '../libs/supabase'

/**
 * Provides schema file content and format for AI context enrichment, enabling more accurate
 * metadata generation by giving the AI model visibility into the actual schema structure.
 *
 * @throws Error if schema path, format, or content cannot be retrieved
 */
export const fetchSchemaFileContent = async (
  projectId: string,
  branchName: string,
  repositoryFullName: string,
  installationId: number,
): Promise<{ content: string; format: SupportedFormat }> => {
  const supabase = createClient()

  const { data: schemaFilePath, error: pathError } = await supabase
    .from('schema_file_paths')
    .select('path, format')
    .eq('project_id', projectId)
    .single()

  if (pathError || !schemaFilePath) {
    throw new Error(
      `No schema path found for project ${projectId}: ${JSON.stringify(pathError)}`,
    )
  }

  if (!schemaFilePath.format) {
    throw new Error(
      `No format found for schema file path ${schemaFilePath.path}`,
    )
  }

  // Validate the format against supported formats
  const formatResult = safeParse(supportedFormatSchema, schemaFilePath.format)
  if (!formatResult.success) {
    throw new Error(`Unsupported format: ${schemaFilePath.format}`)
  }

  const validFormat = formatResult.output

  const fileData = await getFileContent(
    repositoryFullName,
    schemaFilePath.path,
    branchName,
    installationId,
  )

  if (!fileData.content) {
    throw new Error(`No content found for ${schemaFilePath.path}`)
  }

  return {
    content: fileData.content,
    format: validFormat,
  }
}
