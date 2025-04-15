const path = require('path')
const fs = require('fs-extra')
const YAML = require('yaml')
const { parse, setPrismWasmUrl } = require('@liam-hq/db-structure/parser')
const { overrideSchema } = require('@liam-hq/db-structure')

// Configuration
const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../packages/prompt-test/src/fixtures/github.com/liam-hq/liam/pull/1105/fixture.yaml',
)
const SCHEMA_OVERRIDE_PATH = path.resolve(
  __dirname,
  '../mock-schema-override.yml',
)
const PRISM_WASM_PATH = path.resolve(
  __dirname,
  '../../../db-structure/node_modules/@ruby/prism/src/prism.wasm',
)
const OUTPUT_PATH = path.resolve(__dirname, '../overridden-schema.json')

async function main() {
  try {
    // Read the fixture file
    process.stdout.write('Reading fixture file...\n')
    const fixtureContent = await fs.readFile(FIXTURE_PATH, 'utf-8')
    const fixture = YAML.parse(fixtureContent)

    // Extract the raw schema content
    const { schemaFile } = fixture.vars

    if (!schemaFile || !schemaFile.content) {
      throw new Error('No schema content found in fixture')
    }

    process.stdout.write('Parsing schema content...\n')

    // Set up the WASM path for the parser
    setPrismWasmUrl(PRISM_WASM_PATH)

    // Use postgres format for SQL schema
    const format = 'postgres'
    process.stdout.write(`Using format: ${format}\n`)

    // Parse the schema with detected format
    const { value: schema, errors } = await parse(schemaFile.content, format)

    if (errors.length > 0) {
      console.warn('Errors parsing schema file:', errors)
    }

    // Read schema override if it exists
    let currentSchemaMeta = null
    try {
      if (await fs.pathExists(SCHEMA_OVERRIDE_PATH)) {
        process.stdout.write('Reading schema override file...\n')
        const overrideContent = await fs.readFile(SCHEMA_OVERRIDE_PATH, 'utf-8')
        currentSchemaMeta = YAML.parse(overrideContent)
      } else {
        process.stdout.write(
          'No schema override file found, using default schema\n',
        )
      }
    } catch (error) {
      console.warn('Error reading schema override:', error)
    }

    // Apply overrides to schema if currentSchemaMeta exists
    const overriddenSchema = currentSchemaMeta
      ? overrideSchema(schema, currentSchemaMeta).schema
      : schema

    // Save the overridden schema to a JSON file
    process.stdout.write(`Saving overridden schema to ${OUTPUT_PATH}...\n`)
    await fs.writeFile(
      OUTPUT_PATH,
      JSON.stringify(overriddenSchema, null, 2),
      'utf-8',
    )

    process.stdout.write('Schema saved successfully!\n')
  } catch (error) {
    console.error('Error processing schema:', error)
    process.exit(1)
  }
}

main()
