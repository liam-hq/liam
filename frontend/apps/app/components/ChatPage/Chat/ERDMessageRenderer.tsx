'use client'

import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initSchemaStore } from '@/stores'
import { type FC, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parse } from 'valibot'
import styles from './ERDMessageRenderer.module.css'
import { parseERDFromMarkdown } from './utils/parseERDFromMarkdown'

interface ERDMessageRendererProps {
  content: string
}

export const ERDMessageRenderer: FC<ERDMessageRendererProps> = ({
  content,
}) => {
  const { hasERD, normalContent, schema } = parseERDFromMarkdown(content)

  useEffect(() => {
    if (schema) {
      initSchemaStore(schema)
    }
  }, [schema])

  const versionData = {
    version: '0.1.0', // NOTE: no maintained version for ERD Web
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = parse(versionSchema, versionData)

  if (!hasERD) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  }

  return (
    <>
      {normalContent && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {normalContent}
        </ReactMarkdown>
      )}
      {schema && (
        <div className={styles.erdContainer}>
          <VersionProvider version={version}>
            <ERDRenderer
              defaultSidebarOpen={false}
              errorObjects={[]}
              tableGroups={schema.tableGroups}
            />
          </VersionProvider>
          {/* <pre className={styles.messageText}>
            {`ERD detected! Schema with ${Object.keys(schema.tables).length} tables and ${Object.keys(schema.relationships).length} relationships.`}

            {Object.keys(schema.tables).map((tableName) => `\n- ${tableName}`)}
          </pre> */}
        </div>
      )}
    </>
  )
}
