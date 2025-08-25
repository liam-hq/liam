'use client'

import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { CopyButton } from '../../../CopyButton'
import styles from './Artifact.module.css'
import { TableOfContents } from './TableOfContents/TableOfContents'
import {
  EXECUTION_SECTION_TITLE,
  FAILURE_ICON,
  FAILURE_STATUS,
  generateHeadingId,
  SUCCESS_ICON,
  SUCCESS_STATUS,
} from './utils'

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
      <div className={styles.contentWrapper} data-artifact-content>
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

                  // Check if this paragraph contains execution section title
                  if (text.includes(`${EXECUTION_SECTION_TITLE}:`)) {
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
                  const successPattern = `${SUCCESS_ICON} ${SUCCESS_STATUS}`
                  const failurePattern = `${FAILURE_ICON} ${FAILURE_STATUS}`
                  const executionLogPattern = new RegExp(
                    `^(.+?):\\s*(${successPattern}|${failurePattern})\\s*-\\s*(.+)$`,
                  )
                  const executionLogMatch = text.match(executionLogPattern)
                  if (executionLogMatch) {
                    const [, timestamp, status, message] = executionLogMatch
                    const isSuccess = status?.includes(successPattern)
                    return (
                      <li className={styles.executionLogItem} {...rest}>
                        <span
                          className={
                            isSuccess
                              ? styles.executionLogSuccess
                              : styles.executionLogFailed
                          }
                        >
                          {status} - {message}
                        </span>
                        <span className={styles.executionLogTimestamp}>
                          {timestamp}
                        </span>
                      </li>
                    )
                  }

                  return <li {...rest}>{children}</li>
                },
                code(props: CodeProps) {
                  const { children, className, ...rest } = props
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match && !className

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
                  const id = generateHeadingId(text)
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  )
                },
                h2: ({ children, ...props }) => {
                  const text = String(children)
                  const id = generateHeadingId(text)
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                h3: ({ children, ...props }) => {
                  const text = String(children)
                  const id = generateHeadingId(text)
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
                h4: ({ children, ...props }) => {
                  const text = String(children)
                  const id = generateHeadingId(text)
                  return (
                    <h4 id={id} {...props}>
                      {children}
                    </h4>
                  )
                },
                h5: ({ children, ...props }) => {
                  const text = String(children)
                  const id = generateHeadingId(text)
                  return (
                    <h5 id={id} {...props}>
                      {children}
                    </h5>
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
