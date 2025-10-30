import type { Schema } from '@liam-hq/schema'
import { useMemo } from 'react'
import { schemaToDdl } from '../utils/schemaToDdl'

type Props = {
  currentSchema: Schema | null
}

type Result = {
  cumulativeDdl: string
}

export const useDdl = ({ currentSchema }: Props): Result => {
  const cumulativeDdl = useMemo(() => {
    if (!currentSchema) return ''
    const result = schemaToDdl(currentSchema)
    return result.ddl
  }, [currentSchema])

  return {
    cumulativeDdl,
  }
}
