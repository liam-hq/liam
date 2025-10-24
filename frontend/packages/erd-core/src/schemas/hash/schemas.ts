import { custom } from 'valibot'

type HashType = 'columns' | 'indexes'
const hashTypes = ['columns', 'indexes'] as const satisfies HashType[]

export const hashSchema = custom<`${string}__${HashType}__${string}`>(
  (input): input is `${string}__${HashType}__${string}` => {
    if (typeof input !== 'string') return false

    return hashTypes.some((hashType) => {
      const parts = input.split(`__${hashType}__`)
      return parts.length === 2 && parts[0] && parts[1]
    })
  },
)
