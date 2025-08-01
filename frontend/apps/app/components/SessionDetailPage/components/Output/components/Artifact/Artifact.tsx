'use client'

import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { CopyButton } from '../shared/CopyButton'
import styles from './Artifact.module.css'
import { type DMLBlock, ExecutableDMLBlock } from './ExecutableDMLBlock'
import { SeverityBadge } from './SeverityBadge'
import { TableOfContents } from './TableOfContents'

type CodeProps = {
  className?: string
  children?: ReactNode
} & HTMLAttributes<HTMLElement>

type Props = {
  doc: string
}

export const Artifact: FC<Props> = ({ doc }) => {
  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <CopyButton textToCopy={doc} tooltipLabel="Copy Markdown" />
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.bodyWrapper}>
          <div className={styles.body}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                p(props) {
                  const { children, ...rest } = props

                  // Extract text content from children
                  const extractText = (node: unknown): string => {
                    if (typeof node === 'string') return node
                    if (Array.isArray(node))
                      return node.map(extractText).join('')
                    if (
                      node &&
                      typeof node === 'object' &&
                      'props' in node &&
                      // @ts-expect-error - React children can be any type
                      node.props?.children
                    )
                      // @ts-expect-error - React children can be any type
                      return extractText(node.props.children)
                    return ''
                  }

                  const text = extractText(children)

                  // Detect severity:Level format and replace with badge
                  const severityMatch = text.match(
                    /^severity:\s*(High|Medium|Low)$/i,
                  )
                  if (severityMatch) {
                    const level = severityMatch[1] as 'High' | 'Medium' | 'Low'
                    return <SeverityBadge level={level} />
                  }

                  // Check if this paragraph contains "Execution Logs:"
                  if (text.includes('Execution Logs:')) {
                    return (
                      <p className={styles.executionLogsHeading} {...rest}>
                        {children}
                      </p>
                    )
                  }

                  return <p {...rest}>{children}</p>
                },
                li(props) {
                  const { children, ...rest } = props

                  // Extract text content from children
                  const extractText = (node: unknown): string => {
                    if (typeof node === 'string') return node
                    if (Array.isArray(node))
                      return node.map(extractText).join('')
                    if (
                      node &&
                      typeof node === 'object' &&
                      'props' in node &&
                      // @ts-expect-error - React children can be any type
                      node.props?.children
                    )
                      // @ts-expect-error - React children can be any type
                      return extractText(node.props.children)
                    return ''
                  }

                  const text = extractText(children)

                  // Check if this is an execution log entry
                  const executionLogMatch = text.match(
                    /^(.+?):\s*(✅ Success|❌ Failed)\s*-\s*(.+)$/,
                  )
                  if (executionLogMatch) {
                    const [, timestamp, status, message] = executionLogMatch
                    const isSuccess = status && status.includes('✅ Success')
                    return (
                      <li {...rest}>
                        <span className={styles.executionLogTimestamp}>
                          {timestamp}:
                        </span>{' '}
                        <span
                          className={
                            isSuccess
                              ? styles.executionLogSuccess
                              : styles.executionLogFailed
                          }
                        >
                          {status} - {message}
                        </span>
                      </li>
                    )
                  }

                  // Check if this is a use case (starts with number and has bold text)
                  const useCaseMatch = text.match(/^(\d+)\.\s+([^-]+)/)
                  if (useCaseMatch) {
                    const number = useCaseMatch[1]
                    const titlePart = useCaseMatch[2]?.trim() || ''

                    // Find the parent requirement ID from the document structure
                    // Since we can't easily track state here, we'll use a simpler ID
                    const id = `use-case-${number}-${titlePart
                      .toLowerCase()
                      .replace(/[^\w]+/g, '-')
                      .replace(/(^-|-$)/g, '')
                      .substring(0, 50)}`

                    return (
                      <li id={id} {...rest}>
                        {children}
                      </li>
                    )
                  }

                  return <li {...rest}>{children}</li>
                },
                code(props: CodeProps) {
                  const { children, className, ...rest } = props
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match && !className
                  const language = match?.[1]

                  // Use ExecutableDMLBlock for SQL code blocks
                  if (!isInline && language === 'sql') {
                    const sqlCode = String(children).replace(/\n$/, '')
                    const dmlBlock: DMLBlock = {
                      name: 'SQL Query',
                      code: sqlCode,
                    }
                    return <ExecutableDMLBlock dmlBlock={dmlBlock} />
                  }

                  return !isInline && match ? (
                    <SyntaxHighlighter
                      // @ts-expect-error - syntaxTheme has a complex type structure that's compatible at runtime
                      style={syntaxTheme}
                      language={match[1]}
                      PreTag="div"
                      customStyle={syntaxCustomStyle}
                      codeTagProps={syntaxCodeTagProps}
                      {...rest}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  )
                },
                h1: ({ children, ...props }) => {
                  const text = String(children)
                  const id = text
                    .toLowerCase()
                    .replace(/[^\w]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  )
                },
                h2: ({ children, ...props }) => {
                  const text = String(children)
                  const id = text
                    .toLowerCase()
                    .replace(/[^\w]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                h3: ({ children, ...props }) => {
                  const text = String(children)
                  const id = text
                    .toLowerCase()
                    .replace(/[^\w]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
                h4: ({ children, ...props }) => {
                  const text = String(children)
                  const id = text
                    .toLowerCase()
                    .replace(/[^\w]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                  return (
                    <h4 id={id} {...props}>
                      {children}
                    </h4>
                  )
                },
              }}
            >
              {doc}
            </ReactMarkdown>
          </div>
        </div>
        <TableOfContents content={doc} />
      </div>
    </div>
  )
}
