'use client'

import { fromPromise } from '@liam-hq/neverthrow'
import type { Schema } from '@liam-hq/schema'
import {
  type MigrationOperation,
  postgresqlMigrationOperationDeparser,
  postgresqlSchemaDeparser,
  yamlSchemaDeparser,
} from '@liam-hq/schema'
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
import { type FC, useState } from 'react'
import styles from './ExportDropdown.module.css'

type Props = {
  disabled?: boolean
  schema: Schema
  artifactDoc?: string
  cumulativeOperations: MigrationOperation[]
}

const generateCumulativeDDL = (operations: MigrationOperation[]): string => {
  const ddlStatements: string[] = []

  for (const operation of operations) {
    const result = postgresqlMigrationOperationDeparser(operation)
    if (result.errors.length === 0 && result.value.trim()) {
      ddlStatements.push(result.value)
    }
  }

  return ddlStatements.join('\n\n')
}

const generateAIPrompt = (
  artifactDoc: string,
  cumulativeOperations: MigrationOperation[],
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
  disabled,
  schema,
  artifactDoc,
  cumulativeOperations,
}) => {
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const handleOpenChange = (open: boolean) => {
    if (disabled) {
      setOpen(false)
      return
    }

    setOpen(open)
  }

  const handleCopyAIPrompt = async () => {
    if (!artifactDoc) return

    const prompt = generateAIPrompt(artifactDoc, cumulativeOperations)
    const clipboardResult = await fromPromise(
      navigator.clipboard.writeText(prompt),
    )

    clipboardResult.match(
      () => {
        toast({
          title: 'AI Prompt copied!',
          description: 'AI prompt has been copied to clipboard',
          status: 'success',
        })
      },
      (error: Error) => {
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
    const result = postgresqlSchemaDeparser(schema)
    const ddl = result.value ? `${result.value}\n` : ''

    const clipboardResult = await fromPromise(
      navigator.clipboard.writeText(ddl),
    )

    clipboardResult.match(
      () => {
        toast({
          title: 'PostgreSQL DDL copied!',
          description: 'Schema DDL has been copied to clipboard',
          status: 'success',
        })
      },
      (error: Error) => {
        console.error('Failed to copy PostgreSQL DDL to clipboard:', error)
        toast({
          title: 'Copy failed',
          description: `Failed to copy DDL to clipboard: ${error.message}`,
          status: 'error',
        })
      },
    )
  }

  const handleCopyYaml = async () => {
    const yamlResult = yamlSchemaDeparser(schema)

    if (yamlResult.isErr()) {
      const error = yamlResult.error
      console.error('Failed to generate YAML:', error)
      toast({
        title: 'Export failed',
        description: `Failed to generate YAML: ${error.message}`,
        status: 'error',
      })
      return
    }

    const yamlContent = yamlResult.value
    const clipboardResult = await fromPromise(
      navigator.clipboard.writeText(yamlContent),
    )

    clipboardResult.match(
      () => {
        toast({
          title: 'YAML copied!',
          description: 'Schema YAML has been copied to clipboard',
          status: 'success',
        })
      },
      (error: Error) => {
        console.error('Failed to copy YAML to clipboard:', error)
        toast({
          title: 'Copy failed',
          description: `Failed to copy YAML to clipboard: ${error.message}`,
          status: 'error',
        })
      },
    )
  }

  return (
    <DropdownMenuRoot open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled}
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
          <DropdownMenuItem
            leftIcon={<Copy size={16} />}
            onSelect={handleCopyYaml}
          >
            Copy YAML
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
