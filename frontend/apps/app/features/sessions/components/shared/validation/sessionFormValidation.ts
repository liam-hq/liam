import * as v from 'valibot'

export type CreateSessionState = {
  success: boolean
  error?: string
}

// A pipe that transforms an empty string to null.
const emptyStringToNull = v.pipe(
  v.string(),
  v.transform((input) => (input === '' ? null : input)),
)

// Base form schema shared across all session types
const BaseFormDataSchema = v.object({
  parentDesignSessionId: v.optional(v.nullable(emptyStringToNull)),
  initialMessage: v.pipe(
    v.string(),
    v.minLength(1, 'Initial message is required'),
  ),
  isDeepModelingEnabled: v.optional(
    v.pipe(
      v.string(),
      v.transform((input) => input === 'true'),
    ),
    'true',
  ),
})

// GitHub-specific form schema
export const GitHubFormDataSchema = v.object({
  ...BaseFormDataSchema.entries,
  projectId: v.optional(v.nullable(emptyStringToNull)),
  gitSha: v.optional(v.nullable(v.string())),
})

// Schema format type
export type SchemaFormat = 'postgres' | 'schemarb' | 'prisma' | 'tbls'

// Upload-specific form schema
export const UploadFormDataSchema = v.object({
  ...BaseFormDataSchema.entries,
  schemaFile: v.file('Schema file is required'),
  schemaFormat: v.pipe(
    v.string(),
    v.picklist(['postgres', 'schemarb', 'prisma', 'tbls']),
  ),
})

// URL-specific form schema
export const UrlFormDataSchema = v.object({
  ...BaseFormDataSchema.entries,
  schemaUrl: v.pipe(v.string(), v.url('Please enter a valid URL')),
  schemaFormat: v.pipe(
    v.string(),
    v.picklist(['postgres', 'schemarb', 'prisma', 'tbls']),
  ),
})

// Repository and project types
export type RepositoryData = {
  name: string
  owner: string
  github_installation_identifier: number
}

export type ProjectData = {
  id: string
  project_repository_mappings: {
    github_repositories: RepositoryData
  }[]
}

export type SchemaFilePathData = {
  path: string
  format: 'schemarb' | 'postgres' | 'prisma' | 'tbls'
}

// Common helper functions
export const parseFormData = <T>(
  formData: FormData,
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
): v.SafeParseResult<typeof schema> => {
  const rawData = Object.fromEntries(formData.entries())
  return v.safeParse(schema, rawData)
}
