'use client'

import { useTheme } from 'next-themes'
import { notFound } from 'next/navigation'
import { useParams } from 'next/navigation'
import { SchemaApp } from '../../../../../../../yaml-editor/SchemaApp'
import styles from '../../page.module.css'

export default function YamlEditorSchemaPage() {
  const { theme } = useTheme()
  const params = useParams()
  const schemaId = params.id as string

  if (!schemaId) {
    return notFound()
  }

  return (
    <div className={styles.yamlEditorPageInContent} data-theme={theme}>
      <div className={styles.yamlEditorContainer}>
        <SchemaApp schemaId={schemaId} />
      </div>
    </div>
  )
}
