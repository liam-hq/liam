import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { fetchFigmaLocalVariables } from './fetchFigmaLocalVariables.mjs'
import { runStyleDictionary } from './runStyleDictionary.mjs'
import { transformVariablesForStyleDictionary } from './transformVariablesForStyleDictionary.mjs'

// Load environment variables from package-specific .env.local file
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

/**
 * Main function to handle command line arguments and execute corresponding tasks.
 *
 * Command line arguments:
 * - `--fetch`: Fetches Figma local variables.
 * - `--transform`: Transforms variables for Style Dictionary.
 * - `--generate`: Runs Style Dictionary with the specified output path.
 * - `--output <path>`: Specifies the output path for the generated files. Defaults to 'build/css'.
 * - `--filter-modes <modes>`: Specifies filter modes for Style Dictionary as a comma-separated list.
 *
 * If no specific argument is provided, it defaults to running all steps in sequence.
 *
 * @returns {Promise<void>} A promise that resolves when all tasks are completed.
 */
async function main() {
  const args = process.argv.slice(2)

  let outputPath = null
  const filterModes = []

  if (args.includes('--output')) {
    const outputIndex = args.indexOf('--output')
    if (outputIndex !== -1 && args[outputIndex + 1]) {
      outputPath = args[outputIndex + 1]
    }
  }

  if (args.includes('--filter-modes')) {
    const filterModesIndex = args.indexOf('--filter-modes')
    if (filterModesIndex !== -1 && args[filterModesIndex + 1]) {
      filterModes.push(...args[filterModesIndex + 1].split(','))
    }
  }

  if (args.includes('--fetch')) {
    await fetchFigmaLocalVariables()
  } else if (args.includes('--transform')) {
    await transformVariablesForStyleDictionary()
  } else if (args.includes('--generate')) {
    await runStyleDictionary(outputPath, filterModes)
  } else {
    // Default to running all steps
    await fetchFigmaLocalVariables()
    await transformVariablesForStyleDictionary()
    await runStyleDictionary(outputPath, filterModes)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
