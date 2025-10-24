// biome-ignore lint/correctness/noNodejsModules: This import is server-side.
import { exec } from 'node:child_process'
// biome-ignore lint/correctness/noNodejsModules: This import is server-side.
import { readFile, writeFile } from 'node:fs/promises'
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

    // Post-process generated code for Zod v4 compatibility
    // json-schema-to-zod doesn't support Zod v4 yet, so we need to fix z.record() calls
    // Zod v4 requires two arguments: z.record(keySchema, valueSchema)
    // @see https://github.com/StefanTerdell/json-schema-to-zod/issues/122
    let generatedCode = await readFile(OUTPUT_PATH, 'utf-8')
    generatedCode = generatedCode.replace(/\.record\(/g, '.record(z.string(), ')

    await writeFile(OUTPUT_PATH, generatedCode)

    console.info(`Successfully generated Zod schema at ${OUTPUT_PATH}`)
  } catch (error) {
    console.error('Error generating schema:', error)
    process.exit(1)
  }
}

main()
