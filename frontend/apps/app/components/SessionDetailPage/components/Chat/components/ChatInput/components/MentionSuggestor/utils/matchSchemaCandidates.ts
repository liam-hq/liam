import type { Schema } from '@liam-hq/db-structure'
import { getAllMentionCandidates } from './getAllMentionCandidates'

type Params = {
  schema: Schema
  query: string
  options?: {
    limit?: number
  }
}

export function matchSchemaCandidates({ schema, query, options }: Params) {
  const { limit } = options ?? {}
  const candidates = getAllMentionCandidates(schema)

  const filtered = query
    ? candidates.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      )
    : candidates

  const limited = limit && limit > 0 ? filtered.slice(0, limit) : filtered

  return limited
}
