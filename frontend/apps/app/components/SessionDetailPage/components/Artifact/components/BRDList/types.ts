import type { Schema } from '@liam-hq/db-structure'

export type DMLBlock = {
  name: string
  code: string
}

type Step = {
  order: number
  description: string
  dmlBlocks?: DMLBlock[]
}

export type UseCase = {
  id: string
  name: string
  steps: Step[]
}

export type BusinessRequirement = {
  id: string
  name: string
  overview: string[]
  relatedSchema: Schema
  useCases: UseCase[]
}
