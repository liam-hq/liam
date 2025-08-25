'use client'

import type { Schema } from '@liam-hq/schema'
import { type Operation, postgresqlOperationDeparser } from '@liam-hq/schema'
import {
  Button,
  ChevronDown,
  Copy,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  FileText,
  useToast,
} from '@liam-hq/ui'
import { fromPromise } from 'neverthrow'
import type { FC } from 'react'
import { schemaToDdl } from '../SQL/utils/schemaToDdl'
import styles from './ExportDropdown.module.css'

type Props = {
  schema: Schema
  artifactDoc?: string
  cumulativeOperations: Operation[]
}

const generateCumulativeDDL = (operations: Operation[]): string => {
  const ddlStatements: string[] = []

  for (const operation of operations) {
    const result = postgresqlOperationDeparser(operation)
    if (result.errors.length === 0 && result.value.trim()) {
      ddlStatements.push(result.value)
    }
  }

  return ddlStatements.join('\n\n')
}

const generateAIPrompt = (
  artifactDoc: string,
  cumulativeOperations: Operation[],
): string => {
  // Generate cumulative DDL diff
  const ddlContent = generateCumulativeDDL(cumulativeOperations)

  return `# Database Schema Design

${artifactDoc}

## Schema Migrations
\`\`\`sql
${ddlContent}\`\`\`

## Implementation Guidance
Please implement according to this design. Use the above requirements analysis and SQL schema as reference to create appropriate database design and application implementation.

- Maintain schema consistency
- Correctly implement constraints and relationships defined in requirements
- Consider performance and security
`
}

export const ExportDropdown: FC<Props> = ({
  schema,
  artifactDoc,
  cumulativeOperations,
}) => {
  const toast = useToast()

  const handleCopyAIPrompt = async () => {
    if (!artifactDoc) return

    const prompt = generateAIPrompt(artifactDoc, cumulativeOperations)
    const clipboardResult = await fromPromise(
      navigator.clipboard.writeText(prompt),
      (error) =>
        error instanceof Error ? error : new Error('Clipboard write failed'),
    )

    clipboardResult.match(
      () => {
        toast({
          title: 'AI Prompt copied!',
          description: 'AI prompt has been copied to clipboard',
          status: 'success',
        })
      },
      (error) => {
        console.error('Failed to copy AI prompt to clipboard:', error)
        toast({
          title: 'Copy failed',
          description: `Failed to copy AI prompt to clipboard: ${error.message}`,
          status: 'error',
        })
      },
    )
  }

  const handleCopyPostgreSQL = async () => {
    const ddlResult = schemaToDdl(schema)

    const clipboardResult = await fromPromise(
      navigator.clipboard.writeText(ddlResult.ddl),
      (error) =>
        error instanceof Error ? error : new Error('Clipboard write failed'),
    )

    clipboardResult.match(
      () => {
        toast({
          title: 'PostgreSQL DDL copied!',
          description: 'Schema DDL has been copied to clipboard',
          status: 'success',
        })
      },
      (error) => {
        console.error('Failed to copy PostgreSQL DDL to clipboard:', error)
        toast({
          title: 'Copy failed',
          description: `Failed to copy DDL to clipboard: ${error.message}`,
          status: 'error',
        })
      },
    )
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline-secondary"
          size="md"
          rightIcon={<ChevronDown size={16} />}
          className={styles.button}
        >
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={8}>
          {artifactDoc && cumulativeOperations.length > 0 && (
            <DropdownMenuItem
              leftIcon={<FileText size={16} />}
              onSelect={handleCopyAIPrompt}
            >
              Prompt for AI Agent
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            leftIcon={<Copy size={16} />}
            onSelect={handleCopyPostgreSQL}
          >
            Copy PostgreSQL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
