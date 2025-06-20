import type { Tables } from '@liam-hq/db'

export type ReviewComment = {
  fromLine: number
  toLine: number
  severity: 'High' | 'Medium' | 'Low'
  message: string
}

export type Version = Pick<Tables<'building_schema_versions'>, 'id' | 'number'>

export type BuildingSchema = Pick<Tables<'building_schemas'>, 'id' | 'schema'>
