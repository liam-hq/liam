// biome-ignore lint/correctness/noNodejsModules: This import is server-side.
import { exec } from 'node:child_process'
// biome-ignore lint/correctness/noNodejsModules: This import is server-side.
import { writeFile } from 'node:fs/promises'
// biome-ignore lint/correctness/noNodejsModules: This import is server-side.
import { tmpdir } from 'node:os'
// biome-ignore lint/correctness/noNodejsModules: This import is server-side.
import { join } from 'node:path'
// biome-ignore lint/correctness/noNodejsModules: This import is server-side.
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const TBLS_SCHEMA_URL =
  'https://raw.githubusercontent.com/k1LoW/tbls/v1.81.0/spec/tbls.schema.json_schema.json'
const OUTPUT_PATH = 'src/parser/tbls/schema.generated.ts'

async function main() {
  try {
    const response = await fetch(TBLS_SCHEMA_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`)
    }
    const schema = await response.text()

    const tempFile = join(tmpdir(), 'tbls-schema.json')
    await writeFile(tempFile, schema)

    const command = `json-refs resolve ${tempFile} | json-schema-to-zod -o ${OUTPUT_PATH}`
    await execAsync(command)

    console.info(`Successfully generated Zod schema at ${OUTPUT_PATH}`)
  } catch (error) {
    console.error('Error generating schema:', error)
    process.exit(1)
  }
}

main()
