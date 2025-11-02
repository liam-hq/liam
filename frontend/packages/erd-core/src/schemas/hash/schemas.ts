import { custom } from 'valibot'

type HashType = 'columns' | 'indexes'
const hashTypes = ['columns', 'indexes'] as const satisfies HashType[]

type HashSchemaType =
  | `${string}__${HashType}` // category level hash
  | `${string}__${HashType}__${string}` // item level hash

export const hashSchema = custom<HashSchemaType>(
  (input): input is HashSchemaType => {
    if (typeof input !== 'string') return false

    return hashTypes.some((hashType) => {
      // category level hash
      if (input.endsWith(`__${hashType}`)) {
        return true
      }

      // item level hash
      const parts = input.split(`__${hashType}__`)
      return parts.length === 2 && parts[0] && parts[1]
    })
  },
)
