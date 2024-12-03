import { dbStructureSchema } from '@liam-hq/db-structure'
import { ERDRenderer, initDBStructureStore } from '@liam-hq/erd-core'
import * as v from 'valibot'

async function loadSchemaContent() {
  try {
    const response = await fetch('/schema.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`)
    }
    const data = await response.json()
    const result = v.safeParse(dbStructureSchema, data)
    result.success
      ? initDBStructureStore(result.output)
      : console.info(result.issues)
  } catch (error) {
    console.error('Error loading schema content:', error)
  }
}

loadSchemaContent()

function App() {
  return <ERDRenderer />
}

export default App
