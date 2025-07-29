import { dmlOperationSchema } from '@liam-hq/artifact'
import * as v from 'valibot'

// Single usecase schema
const usecaseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()), // UUID
  requirementType: v.picklist(['functional', 'non_functional']), // Type of requirement
  requirementCategory: v.string(), // Category of the requirement
  requirement: v.string(), // Content/text of the specific requirement
  title: v.string(),
  description: v.string(),
  dmlOperations: v.array(dmlOperationSchema), // DML operations array
})

export type Usecase = v.InferOutput<typeof usecaseSchema>
