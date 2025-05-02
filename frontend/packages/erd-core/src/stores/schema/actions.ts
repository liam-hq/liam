import type { Schema } from '@liam-hq/db-structure'
import { deepClone } from 'valtio/utils'
import { schemaStore } from './store'

// const initialSchema: Schema = {
//   tables: {},
//   relationships: {},
//   tableGroups: {},
// }

export const initSchemaStore = (schema: Schema) => {
  // // reset
  // for (const key of Object.keys(initialSchema)) {
  //   // @ts-expect-error ... for (const value of Object.keys(obj)) is not typed
  //   schemaStore[key] = deepClone(initialSchema[key])
  // }

  for (const key of Object.keys(schema)) {
    // @ts-expect-error ... for (const value of Object.keys(obj)) is not typed
    schemaStore[key] = deepClone(schema[key])
  }
}
