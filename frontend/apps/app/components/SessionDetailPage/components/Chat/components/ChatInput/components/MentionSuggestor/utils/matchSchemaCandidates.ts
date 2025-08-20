import type { Schema } from '@liam-hq/schema'
import { getAllMentionCandidates } from './getAllMentionCandidates'

type Params = {
  schema: Schema
  query: string
  // eslint-disable-next-line no-restricted-syntax
  options?: {
    // eslint-disable-next-line no-restricted-syntax
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
