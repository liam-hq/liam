import type { Schema } from '@liam-hq/db-structure'
import { useMemo } from 'react'
import { schemaToDdl } from '../utils/schemaToDdl'

type UseSQLProps = {
  currentSchema: Schema | null
  prevSchema: Schema | null
}

type UseSQLResult = {
  cumulativeDdl: string
  prevCumulativeDdl: string
}

export const useSql = ({
  currentSchema,
  prevSchema,
}: UseSQLProps): UseSQLResult => {
  // Generate DDL from schemas
  const cumulativeDdl = useMemo(() => {
    if (!currentSchema) return ''
    const result = schemaToDdl(currentSchema)
    return result.ddl
  }, [currentSchema])

  const prevCumulativeDdl = useMemo(() => {
    if (!prevSchema) return ''
    const result = schemaToDdl(prevSchema)
    return result.ddl
  }, [prevSchema])

  return {
    cumulativeDdl,
    prevCumulativeDdl,
  }
}
