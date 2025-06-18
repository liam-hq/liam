'use client'

import { Button, Spinner } from '@/components'
import { type FC, useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql'
import { atomOneDark as base } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import styles from './ExecutableDMLBlock.module.css'

export type DMLBlock = {
  name: string
  code: string
}

SyntaxHighlighter.registerLanguage('sql', sql)

const myTheme = {
  ...base,
  hljs: {
    ...base.hljs,
    padding: 'var(--spacing-4)',
    background: 'var(--global-background)',
    color: 'var(--global-foreground)',
  },
  // keyword: { color: '#F472B6', fontWeight: '700' }, // INSERT, UPDATE…
  // string: { color: '#A7F3D0' }, // 'foo'
  // number: { color: '#FBBF24' },
  // comment: { color: '#6B7280', fontStyle: 'italic' },
}

type ExecutionResult = {
  status: 'success' | 'error' | 'loading'
}

type Props = {
  dmlBlock: DMLBlock
}

export const ExecutableDMLBlock: FC<Props> = ({ dmlBlock }) => {
  const [result, _setResult] = useState<ExecutionResult | null>(null)

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.name}>{dmlBlock.name}</span>
        <Button disabled={result?.status === 'loading'}>
          {result?.status === 'loading' ? (
            <span className={styles.loadingSpinner}>
              <Spinner size="12" />
              Executing...
            </span>
          ) : (
            'Execute SQL'
          )}
        </Button>
      </div>
      <SyntaxHighlighter language="sql" style={myTheme}>
        {dmlBlock.code}
      </SyntaxHighlighter>
    </div>
  )
}
