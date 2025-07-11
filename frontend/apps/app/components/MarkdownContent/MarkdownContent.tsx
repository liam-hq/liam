'use client'

import { syntaxCodeTagProps, syntaxCustomStyle, syntaxTheme } from '@liam-hq/ui'
import type { CSSProperties, FC, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'

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
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
