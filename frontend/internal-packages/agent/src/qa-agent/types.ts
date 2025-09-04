import { dmlOperationSchema } from '@liam-hq/artifact'
import * as v from 'valibot'

export const testcaseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  requirementType: v.picklist(['functional', 'non_functional']),
  requirementCategory: v.string(),
  requirement: v.string(),
  title: v.string(),
  description: v.string(),
  dmlOperation: dmlOperationSchema,
})

export type Testcase = v.InferOutput<typeof testcaseSchema>
