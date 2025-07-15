'use client'

import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { CSSProperties, FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import styles from './MarkdownContent.module.css'

type CodeProps = {
  node?: unknown
  inline?: boolean
  className?: string
  children?: ReactNode
  style?: CSSProperties
} & HTMLAttributes<HTMLElement>

type MarkdownContentProps = {
  content: string
}

export const MarkdownContent: FC<MarkdownContentProps> = ({ content }) => {
  const renderTextWithMarks = (text: string) => {
    const parts = text.split(/(✓|✗)/g)
    return parts.map((part, _index) => {
      if (part === '✓') {
        return (
          <span key={`checkmark-${text}-${part}`} className={styles.checkmark}>
            ✓
          </span>
        )
      }
      if (part === '✗') {
        return (
          <span key={`crossmark-${text}-${part}`} className={styles.crossmark}>
            ✗
          </span>
        )
      }
      return part
    })
  }

  const generateStableKey = (content: string, index: number): string => {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `child-${index}-${hash}`
  }

  const processChildren = (children: ReactNode): ReactNode => {
    if (typeof children === 'string') {
      return renderTextWithMarks(children)
    }
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (typeof child === 'string') {
          return (
            <span key={generateStableKey(child, index)}>
              {renderTextWithMarks(child)}
            </span>
          )
        }
        return child
      })
    }
    return children
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props: CodeProps) {
          const { children, className, node, ...rest } = props
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
        p({ children, ...props }) {
          return <p {...props}>{processChildren(children)}</p>
        },
        li({ children, ...props }) {
          return <li {...props}>{processChildren(children)}</li>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
