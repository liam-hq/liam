import type { Schema } from '@liam-hq/schema'
import { useMemo } from 'react'
import { schemaToDdl } from '../utils/schemaToDdl'

type Props = {
  schema: Schema
  baselineSchema: Schema
}

type Result = {
  cumulativeDdl: string
}

export const useDdl = ({ schema, baselineSchema }: Props): Result => {
  const cumulativeDdl = useMemo(() => {
    const result = schemaToDdl(baselineSchema, schema)
    return result.ddl
  }, [baselineSchema, schema])

  return {
    cumulativeDdl,
  }
}
