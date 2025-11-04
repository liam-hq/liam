'use client'

import {
  AlertTriangle,
  Callout,
  syntaxCodeTagProps,
  syntaxCustomStyle,
  syntaxTheme,
} from '@liam-hq/ui'
import { type FC, type HTMLAttributes, type ReactNode, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { CopyButton } from '../../../CopyButton'
import styles from './Artifact.module.css'
import {
  FAILURE_ICON,
  FAILURE_STATUS,
  SKIP_ICON,
  SKIP_STATUS,
  SUCCESS_ICON,
  SUCCESS_STATUS,
  TEST_RESULTS_SECTION_TITLE,
} from './constants'
import { DesktopToC } from './DesktopToC'
import { MobileToC } from './MobileToC'
import { useActiveHeading } from './useActiveHeading'
import { generateHeadingId } from './utils'
import { extractTocItems } from './utils/extractTocItems'

type CodeProps = {
  className?: string
  children?: ReactNode
} & HTMLAttributes<HTMLElement> & { node?: unknown; inline?: boolean }

type Props = {
  doc: string
  error: Error | null
}

export const Artifact: FC<Props> = ({ doc, error }) => {
  const tocItems = useMemo(() => {
    return extractTocItems(doc)
  }, [doc])

  const { activeId } = useActiveHeading({
    elementIds: tocItems.map((h) => h.id),
  })

  const extractText = (node: unknown): string => {
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map(extractText).join('')
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

  return (
    <div className={styles.container} data-artifact-content>
      {error && (
        <Callout variant="warning" icon={<AlertTriangle size={20} />}>
          {error.message}
        </Callout>
      )}
      <div className={styles.head}>
        <div className={styles.mobileToC}>
          <MobileToC items={tocItems} activeId={activeId} />
        </div>
        <div className={styles.copyButton}>
          <CopyButton textToCopy={doc} tooltipLabel="Copy Markdown" />
        </div>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.bodyWrapper}>
          <div className={styles.body}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                p({ node: _node, children, ...rest }) {
                  const text = extractText(children)

                  // Check if this paragraph contains execution section title
                  if (text.includes(`${TEST_RESULTS_SECTION_TITLE}:`)) {
                    return (
                      <p className={styles.executionLogsHeading} {...rest}>
                        {children}
                      </p>
                    )
                  }

                  return <p {...rest}>{children}</p>
                },
                li({ node: _node, children, ...rest }) {
                  const text = extractText(children)

                  // Check if this is an execution log entry
                  const successPattern = `${SUCCESS_ICON} ${SUCCESS_STATUS}`
                  const failurePattern = `${FAILURE_ICON} ${FAILURE_STATUS}`
                  const skipPattern = `${SKIP_ICON} ${SKIP_STATUS}`
                  const executionLogPattern = new RegExp(
                    `^(.+?):\\s*(${successPattern}|${failurePattern}|${skipPattern})\\s*-\\s*(.+)$`,
                  )
                  const executionLogMatch = text.match(executionLogPattern)
                  if (executionLogMatch) {
                    const [, timestamp, status, message] = executionLogMatch
                    const isSuccess = status?.includes(successPattern)
                    const isSkip = status?.includes(skipPattern)
                    return (
                      <li className={styles.executionLogItem} {...rest}>
                        <span
                          className={
                            isSuccess
                              ? styles.executionLogSuccess
                              : isSkip
                                ? styles.executionLogSkipped
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
                code({
                  node: _node,
                  inline: _inline,
                  children,
                  className,
                  ...rest
                }: CodeProps) {
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
                h1: ({ node: _node, children, ...props }) => {
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  )
                },
                h2: ({ node: _node, children, ...props }) => {
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                h3: ({ node: _node, children, ...props }) => {
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
                h4: ({ node: _node, children, ...props }) => {
                  const text = extractText(children)
                  const id = generateHeadingId(text)
                  return (
                    <h4 id={id} {...props}>
                      {children}
                    </h4>
                  )
                },
                h5: ({ node: _node, children, ...props }) => {
                  const text = extractText(children)
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
        <div className={styles.desktopToc}>
          <DesktopToC items={tocItems} activeId={activeId} />
        </div>
      </div>
    </div>
  )
}
