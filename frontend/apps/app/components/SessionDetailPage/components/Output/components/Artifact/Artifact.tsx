'use client'

import {
  Check,
  Copy,
  IconButton,
  syntaxCodeTagProps,
  syntaxCustomStyle,
  syntaxTheme,
} from '@liam-hq/ui'
import type { FC, HTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import styles from './Artifact.module.css'
import { type DMLBlock, ExecutableDMLBlock } from './ExecutableDMLBlock'
import { SeverityBadge } from './SeverityBadge'

type CodeProps = {
  className?: string
  children?: ReactNode
} & HTMLAttributes<HTMLElement>

type Props = {
  doc: string
}

export const Artifact: FC<Props> = ({ doc }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(doc)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy markdown:', error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <IconButton
          size="md"
          icon={isCopied ? <Check /> : <Copy />}
          tooltipContent={isCopied ? 'Copied!' : 'Copy Markdown'}
          onClick={handleCopyMarkdown}
        />
      </div>
      <div className={styles.body}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            p(props) {
              const { children, ...rest } = props
              const text = String(children)

              // Detect severity:Level format and replace with badge
              const severityMatch = text.match(
                /^severity:\s*(High|Medium|Low)$/i,
              )
              if (severityMatch) {
                const level = severityMatch[1] as 'High' | 'Medium' | 'Low'
                return <SeverityBadge level={level} />
              }

              return <p {...rest}>{children}</p>
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
          }}
        >
          {doc}
        </ReactMarkdown>
      </div>
    </div>
  )
}
