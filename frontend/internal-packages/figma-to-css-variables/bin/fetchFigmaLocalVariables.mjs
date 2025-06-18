import { promises as fs } from 'node:fs'
import { mkdir } from 'node:fs/promises'

/**
 * Fetches local variables from the Figma API and saves them to a temporary file.
 * @returns {Promise<void>}
 */
export async function fetchFigmaLocalVariables() {
  const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY
  const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN

  if (!FIGMA_FILE_KEY || !FIGMA_ACCESS_TOKEN) {
    throw new Error(
      'FIGMA_FILE_KEY and FIGMA_ACCESS_TOKEN environment variables are required.',
    )
  }

  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/variables/local`
  const headers = {
    'X-Figma-Token': FIGMA_ACCESS_TOKEN,
  }

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`Failed to fetch variables: ${response.statusText}`)
  }

  const data = await response.json()

  await mkdir('tmp', { recursive: true })
  await fs.writeFile(
    'tmp/local-variables.json',
    JSON.stringify(data.meta, null, 2),
  )
}
