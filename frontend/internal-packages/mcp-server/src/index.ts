#!/usr/bin/env node
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const uiComponentsPath = path.resolve(
  __dirname,
  '../../../packages/ui/src/components',
)

const server = new McpServer({
  name: 'liam-development-mcp-server',
  version: '0.1.0',
})

type McpToolSuccessResult = {
  content: { type: 'text'; text: string }[]
  isError?: false
}

type McpToolErrorResult = {
  content: { type: 'text'; text: string }[]
  isError: true
  error: string
}

type McpToolResult = McpToolSuccessResult | McpToolErrorResult

server.tool(
  'list_components',
  'Lists all component directories in the UI package',
  async (): Promise<McpToolResult> => {
    try {
      const entries = await fs.readdir(uiComponentsPath, {
        withFileTypes: true,
      })
      const componentDirs = entries
        .filter((entry) => entry.isDirectory())
        .map((dir) => dir.name)

      return { content: [{ type: 'text', text: componentDirs.join('\n') }] }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        content: [],
        isError: true,
        error: `Failed to list components: ${errorMessage}`,
      }
    }
  },
)

server.tool(
  'get_component_files',
  'Gets the content of all .tsx files within a specified UI component directory',
  { componentName: z.string() },
  async ({ componentName }): Promise<McpToolResult> => {
    const componentDir = path.join(uiComponentsPath, componentName)

    // Security check: ensure the resolved path is within the components directory
    const resolvedPath = path.resolve(componentDir)
    if (!resolvedPath.startsWith(uiComponentsPath)) {
      return {
        content: [],
        isError: true,
        error: 'Security error: Path traversal attempt detected.',
      }
    }

    try {
      // Check if component directory exists
      const stats = await fs.stat(componentDir)
      if (!stats.isDirectory()) {
        return {
          content: [],
          isError: true,
          error: `Component "${componentName}" is not a directory.`,
        }
      }

      // Get all .tsx files in the component directory
      const files = await fs.readdir(componentDir)
      const tsxFiles = files.filter((file) => file.endsWith('.tsx'))

      if (tsxFiles.length === 0) {
        return {
          content: [],
          isError: true,
          error: `No .tsx files found in component "${componentName}".`,
        }
      }

      // Read content of each .tsx file
      const fileContents = await Promise.all(
        tsxFiles.map(async (file) => {
          const content = await fs.readFile(
            path.join(componentDir, file),
            'utf8',
          )
          return `=== ${file} ===\n${content}`
        }),
      )

      return { content: [{ type: 'text', text: fileContents.join('\n\n') }] }
    } catch (error) {
      // Check if it's the specific 'ENOENT' error
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return {
          content: [],
          isError: true,
          error: `Component "${componentName}" not found.`,
        }
      }
      // Handle other errors
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        content: [],
        isError: true,
        error: `Failed to get component files: ${errorMessage}`,
      }
    }
  },
)

// Connect server to stdio transport
async function main() {
  try {
    await server.connect(new StdioServerTransport())
  } catch (_error) {
    process.exit(1)
  }
}

main()
