import { custom } from 'valibot'

export const hashSchema = custom<`${string}__columns__${string}`>(
  (input): input is `${string}__columns__${string}` => {
    if (typeof input !== 'string') return false
    const parts = input.split('__columns__')
    return parts.length === 2
  },
)
