export interface Label {
  Name: string
  Virtual: boolean
}

export interface Viewpoint {
  name?: string
  desc?: string
  labels?: string[]
  tables?: string[]
  distance?: number
  groups?: (ViewpointGroup | undefined)[]
}

export interface ViewpointGroup {
  name?: string
  desc?: string
  labels?: string[]
  tables?: string[]
  color?: string
}

export interface Index {
  name: string
  def: string
  table?: string
  columns: string[]
  comment: string
}

export interface Constraint {
  name: string
  type: string
  def: string
  table?: string
  referenced_table?: string
  columns: string[]
  referenced_columns: string[]
  comment: string
}

export interface Trigger {
  name: string
  def: string
  comment: string
}

export interface Column {
  name: string
  type: string
  nullable: boolean
  default: string | null
  comment: string
  extra_def?: string
}

export interface TableViewpoint {
  index: number
  name: string
  desc: string
}

export interface Table {
  name: string
  type: string
  comment: string
  columns: Column[]
  indexes: Index[]
  constraints: Constraint[]
  triggers: Trigger[]
  def: string
}

export interface Relation {
  table?: string
  columns: string[]
  parent_table?: string
  parent_columns: string[]
  cardinality: string
  parent_cardinality: string
  def: string
  virtual: boolean
}

export interface Function {
  name: string
  return_type: string
  arguments: string
  type: string
}

export interface Enum {
  name: string
  values: string[]
}

export interface Driver {
  name: string
  database_version: string
}

export interface Schema {
  name: string
  desc: string
  tables: Table[]
  relations: Relation[]
  functions: Function[]
  enums?: Enum[]
  driver?: Driver
  labels?: Label[]
  viewpoints?: Viewpoint[]
}
