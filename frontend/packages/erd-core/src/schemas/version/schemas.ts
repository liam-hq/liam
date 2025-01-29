import * as v from 'valibot'

const webVersionSchema = v.object({
  gitHash: v.string(),
  date: v.string(),
  displayedOn: v.literal('web'),
})

const cliVersionSchema = v.object({
  version: v.string(),
  gitHash: v.string(),
  envName: v.string(),
  isReleasedGitHash: v.boolean(),
  date: v.string(),
  displayedOn: v.literal('cli'),
})

export const versionSchema = v.union([webVersionSchema, cliVersionSchema])
