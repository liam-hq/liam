import type { Schema } from '@liam-hq/schema'
import { useMemo } from 'react'
import { schemaToDdl } from '../utils/schemaToDdl'

type UseSQLProps = {
  currentSchema: Schema | null
  baselineSchema: Schema | null
}

type UseSQLResult = {
  cumulativeDdl: string
  prevCumulativeDdl: string
}

export const useSql = ({
  currentSchema,
  baselineSchema,
}: UseSQLProps): UseSQLResult => {
  // Generate DDL from schemas
  const cumulativeDdl = useMemo(() => {
    if (!currentSchema) return ''
    const result = schemaToDdl(currentSchema)
    return result.ddl
  }, [currentSchema])

  const prevCumulativeDdl = useMemo(() => {
    if (!baselineSchema) return ''
    const result = schemaToDdl(baselineSchema)
    return result.ddl
  }, [baselineSchema])

  return {
    cumulativeDdl,
    prevCumulativeDdl,
  }
}
