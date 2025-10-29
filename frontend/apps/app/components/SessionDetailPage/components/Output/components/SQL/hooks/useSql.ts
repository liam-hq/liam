import type { Schema } from '@liam-hq/schema'
import { useMemo } from 'react'
import { schemaToDdl } from '../utils/schemaToDdl'

type UseSQLProps = {
  currentSchema: Schema | null
}

type UseSQLResult = {
  cumulativeDdl: string
}

export const useSql = ({ currentSchema }: UseSQLProps): UseSQLResult => {
  // Generate DDL from schemas
  const cumulativeDdl = useMemo(() => {
    if (!currentSchema) return ''
    const result = schemaToDdl(currentSchema)
    return result.ddl
  }, [currentSchema])

  return {
    cumulativeDdl,
  }
}
