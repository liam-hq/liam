import { fromPromise } from '@liam-hq/neverthrow'
import { postgresqlSchemaDeparser, yamlSchemaDeparser } from '@liam-hq/schema'
import {
  Copy,
  Download,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  useToast,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { useSchemaOrThrow } from '../../../../../../stores'
import styles from './ExportButton.module.css'

export const ExportButton: FC = () => {
  const toast = useToast()
  const schema = useSchemaOrThrow()

  const handleCopyPostgreSQL = async () => {
    const result = postgresqlSchemaDeparser(schema.current)
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
    const yamlResult = yamlSchemaDeparser(schema.current)

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
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <button type="button" className={styles.iconWrapper}>
          <Download className={styles.icon} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem
            size="sm"
            leftIcon={<Copy size={16} />}
            onSelect={handleCopyPostgreSQL}
          >
            Copy PostgreSQL
          </DropdownMenuItem>
          <DropdownMenuItem
            size="sm"
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
